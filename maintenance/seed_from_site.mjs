import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const [siteRoot, output] = process.argv.slice(2);
if (!siteRoot || !output) throw new Error('Usage: node maintenance/seed_from_site.mjs SITE_ROOT OUTPUT.json');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(siteRoot, 'js/people-data.js'), 'utf8'), context, { timeout: 1000 });
const source = context.window;
const groups = {
  'Postdoctoral Fellow': 'postdocs', 'PhD Student': 'graduates', 'MPhil Student': 'graduates',
  'Research Assistant': 'assistants', 'Technical & Administrative Assistant': 'assistants',
  'Undergraduate Researcher': 'undergraduates', 'Research Intern': 'interns'
};
const roles = {
  interns: ['Research Intern', '科研实习生'], assistants: ['Technical & Administrative Assistant', '技术与行政助理'],
  undergraduates: ['Undergraduate Researcher', '本科生研究员'], graduates: ['PhD Student', '博士研究生'],
  postdocs: ['Postdoctoral Fellow', '博士后']
};
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dates = (person) => {
  if (person.startMonth || person.endMonth) return [person.startMonth || '', person.endMonth || ''];
  const match = person.period?.match(/^([A-Za-z]+) (\d{4})\s*[–—-]\s*([A-Za-z]+) (\d{4})$/);
  if (!match) throw new Error(`Cannot parse supplied alumni dates for ${person.id}; no dates were inferred`);
  const toISO = (name, year) => {
    const index = monthNames.indexOf(name);
    if (index < 0) throw new Error(`Unknown month: ${name}`);
    return `${year}-${String(index + 1).padStart(2, '0')}`;
  };
  return [toISO(match[1], match[2]), toISO(match[3], match[4])];
};
const current = source.LIN_LAB_PEOPLE.map((person) => ({
  ...person, status: 'current', startMonth: person.startMonth || '', endMonth: person.endMonth || '',
  alumniGroup: groups[person.role], position: '', positionZh: '', nextPosition: '', nextPositionZh: ''
}));
const alumni = source.LIN_LAB_ALUMNI.map((person) => {
  const { group, period, periodZh, ...record } = person;
  const [startMonth, endMonth] = dates(person);
  const [role, roleZh] = roles[group || person.alumniGroup] || [];
  if (!role) throw new Error(`Unknown alumni group for ${person.id}`);
  return {
    nameZh: '', email: '', bio: '', bioZh: '', education: [], educationZh: '', links: [], image: '', objectPosition: '50% 50%',
    position: '', positionZh: '', nextPosition: '', nextPositionZh: '', ...record,
    role: person.role || role, roleZh: person.roleZh || roleZh, status: 'alumni', startMonth, endMonth, alumniGroup: group || person.alumniGroup
  };
});
const seed = { members: [...current, ...alumni], collaborators: source.LIN_LAB_COLLABORATORS };
if (new Set(seed.members.map((person) => person.id)).size !== seed.members.length) throw new Error('Duplicate member IDs');
fs.writeFileSync(output, JSON.stringify(seed, null, 2) + '\n', { mode: 0o600 });
console.log(`Prepared ${current.length} current members, ${alumni.length} alumni, ${seed.collaborators.length} collaborators`);
