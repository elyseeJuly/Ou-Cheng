const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
const MONTH_ELEGANT = ['端月', '杏月', '桃月', '槐月', '榴月', '荷月', '兰月', '桂月', '菊月', '阳月', '葭月', '腊月'];

export function elegantDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  return `${STEMS[(year - 4) % 10]}${BRANCHES[(year - 4) % 12]}年${MONTH_ELEGANT[date.getMonth()]}`;
}
