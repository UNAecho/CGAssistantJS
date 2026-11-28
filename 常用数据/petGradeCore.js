const BP_FIELDS = ['points_endurance', 'points_strength', 'points_defense', 'points_agility', 'points_magical'];
// 每列依次为体、力、防、敏、魔。系数乘以 10，计算到最后才对面板取整。
const PANEL = [
    { field: 'maxhp',           base: 20,  weights: [80, 20, 30, 30, 10] },
    { field: 'maxmp',           base: 20,  weights: [10, 20, 20, 20, 100] },
    { field: 'value_attack',    base: 20,  weights: [2, 27, 3, 3, 2] },
    { field: 'value_defensive', base: 20,  weights: [2, 3, 30, 3, 2] },
    { field: 'value_agility',   base: 20,  weights: [1, 2, 2, 20, 1] },
    { field: 'value_spirit',    base: 100, weights: [-3, -1, 2, -1, 8] },
    { field: 'value_recovery',  base: 100, weights: [8, -1, -1, 2, -3] },
];
const GRADES_PER_BP = 5;
const MAX_DROP = 4;
const RANDOM_TOTAL = 10;
const DETAIL_LIMIT = 20;

function summarizeGrades(pet, candidates) {
    if (candidates.length === 0) {
        throw new Error(pet.realname + '的五项 BP 和七项面板没有匹配的档位组合');
    }
    const totalCounts = Array(BP_FIELDS.length * MAX_DROP + 1).fill(0);
    const countsByStat = BP_FIELDS.map(() => Array(MAX_DROP + 1).fill(0));
    for (const candidate of candidates) {
        let total = 0;
        for (let i = 0; i < BP_FIELDS.length; i++) {
            const drop = Number(candidate.grade[i]);
            total += drop;
            countsByStat[i][drop]++;
        }
        totalCounts[total]++;
    }

    const probability = count => Number((count / candidates.length).toFixed(2));
    const byGrade = {};
    totalCounts.forEach((count, grade) => {
        if (count > 0) byGrade[grade] = probability(count);
    });
    const grades = Object.keys(byGrade).map(Number);
    // 档位由小到大，按日志显示的两位小数比较，同概率取较优档。
    const mostLikely = grades.reduce((best, grade) => byGrade[grade] > byGrade[best] ? grade : best);
    const entry = grade => ({ grade, probability: byGrade[grade] });
    const result = {
        '宠物数据': pet,
        '最优掉档': entry(grades[0]),
        '最差掉档': entry(grades[grades.length - 1]),
        '最可能情况': entry(mostLikely),
        '掉档概率': byGrade,
        '掉档概率矩阵': countsByStat.map(row => row.map(probability)),
    };
    if (candidates.length <= DETAIL_LIMIT) {
        result['可能结果'] = candidates;
    }
    return result;
}

// pet 是预处理后的 CGA 面板，maxGrade 按体、力、防、敏、魔排列。
function calculateLevelOne(pet, maxGrade) {
    if (!pet || pet.level !== 1 || pet.points_remain !== 0) {
        throw new Error('一级宠物算档需要等级为 1 且剩余 BP 为 0');
    }
    if (!Array.isArray(maxGrade) || maxGrade.length !== BP_FIELDS.length ||
        !maxGrade.every(grade => Number.isInteger(grade) && grade >= 0)) {
        throw new Error(pet.realname + '缺少有效的五项满档数据');
    }
    const bp = BP_FIELDS.map(field => pet[field]);
    if (!bp.every(value => Number.isInteger(value) && value >= 0) ||
        !PANEL.every(stat => Number.isInteger(pet[stat.field]))) {
        throw new Error(pet.realname + '需要完整的五项 BP 和七项面板整数');
    }

    // 普通一级宠每一档为 0.2 BP。以档为单位枚举，显示 7 BP 对应 35 至 39。
    const units = Array(bp.length);
    const drops = Array(bp.length);
    const random = Array(bp.length);
    const candidates = [];
    const lower = bp.map((value, i) => Math.max(value * GRADES_PER_BP, maxGrade[i] - MAX_DROP));
    const upper = bp.map((value, i) => Math.min((value + 1) * GRADES_PER_BP - 1, maxGrade[i] + RANDOM_TOTAL));

    function assignDrops(i, remaining) {
        if (i === bp.length) {
            if (remaining === 0) candidates.push({ grade: drops.join(''), radom: random.join('') });
            return;
        }
        // 实际 BP 档数 = 满档 - 掉档 + 随机档。给定掉档后，本项随机档唯一。
        const delta = units[i] - maxGrade[i];
        const first = Math.max(0, -delta);
        const last = Math.min(MAX_DROP, remaining - delta);
        for (let drop = first; drop <= last; drop++) {
            drops[i] = drop;
            random[i] = delta + drop;
            assignDrops(i + 1, remaining - random[i]);
        }
    }

    function findMatchingBP(i) {
        if (i === bp.length) {
            const matches = PANEL.every(({ field, base, weights }) => {
                const sum = weights.reduce((total, weight, j) => total + weight * units[j], 0);
                return base + Math.floor(sum / (GRADES_PER_BP * 10)) === pet[field];
            });
            if (matches) assignDrops(0, RANDOM_TOTAL);
            return;
        }
        for (let value = lower[i]; value <= upper[i]; value++) {
            units[i] = value;
            findMatchingBP(i + 1);
        }
    }

    findMatchingBP(0);
    if (candidates.length <= DETAIL_LIMIT) {
        candidates.sort((a, b) => a.grade.localeCompare(b.grade) || a.radom.localeCompare(b.radom));
    }
    return summarizeGrades(pet, candidates);
}

module.exports = { calculateLevelOne, summarizeGrades };
