(() => {
  const copy = {
    en: {
      back: 'Back to people',
      profile: 'Profile',
      education: 'Education',
      contact: 'Contact',
      links: 'Academic profiles',
      time: 'Time in the lab',
      unavailable: 'Profile unavailable',
      returnLabel: 'Return to people'
    },
    zh: {
      back: '返回成员页',
      profile: '个人简介',
      education: '教育经历',
      contact: '联系方式',
      links: '学术主页',
      time: '在组时间',
      unavailable: '暂未找到该成员资料',
      returnLabel: '返回成员页'
    }
  };

  const create = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const configureNavigation = (chinese, memberId) => {
    const nav = document.querySelector('.site-nav');
    const languageLink = nav?.querySelector('.language');
    const links = nav ? [...nav.querySelectorAll('a:not(.language)')] : [];
    const english = [
      ['Research', 'research.html'], ['Publications', 'publication.html'], ['People', 'people.html'], ['News', 'photography.html'], ['Join us', 'contact.html']
    ];
    const chineseLinks = [
      ['研究', 'research_zh.html'], ['发表论文', 'publication_zh.html'], ['成员', 'people_zh.html'], ['新闻', 'photography_zh.html'], ['加入我们', 'contact_zh.html']
    ];
    const items = chinese ? chineseLinks : english;
    links.forEach((link, index) => {
      link.textContent = items[index][0];
      link.href = items[index][1];
    });
    if (languageLink) {
      languageLink.textContent = chinese ? 'EN' : '中文';
      languageLink.href = chinese ? `profile.html?member=${encodeURIComponent(memberId)}` : `profile.html?member=${encodeURIComponent(memberId)}&lang=zh`;
    }
    const homeHref = chinese ? 'index_zh.html' : 'index.html';
    document.querySelectorAll('.wordmark').forEach((wordmark) => { wordmark.href = homeHref; });
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) skipLink.textContent = chinese ? '跳至正文' : 'Skip to content';
    const footer = document.querySelector('.site-footer');
    if (footer && chinese) {
      const address = footer.querySelector('p');
      if (address) address.innerHTML = '中国广东省广州市南沙区笃学路 1 号<br><a href="mailto:qiaojinlin@hkust-gz.edu.cn">qiaojinlin@hkust-gz.edu.cn</a>';
      const footerLinks = [...footer.querySelectorAll('.site-footer__links a')];
      [['研究', 'research_zh.html'], ['发表论文', 'publication_zh.html'], ['加入我们', 'contact_zh.html']].forEach(([label, href], index) => {
        if (!footerLinks[index]) return;
        footerLinks[index].textContent = label;
        footerLinks[index].href = href;
      });
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector('[data-member-profile]');
    const people = [...(window.LIN_LAB_PEOPLE || []), ...(window.LIN_LAB_ALUMNI || [])];
    if (!root || !Array.isArray(people)) return;

    const params = new URLSearchParams(window.location.search);
    const memberId = params.get('member');
    const chinese = params.get('lang') === 'zh';
    const language = chinese ? 'zh' : 'en';
    const text = copy[language];
    const person = people.find((entry) => entry.id === memberId);
    document.documentElement.lang = chinese ? 'zh-CN' : 'en';
    configureNavigation(chinese, memberId || '');

    if (!person) {
      root.replaceChildren(create('section', 'member-profile__missing', text.unavailable));
      const returnLink = create('a', 'profile-back', text.returnLabel);
      returnLink.href = chinese ? 'people_zh.html' : 'people.html';
      root.querySelector('section').append(returnLink);
      return;
    }

    document.title = `${chinese ? person.nameZh || person.name : person.name} — Lin Lab`;
    const peopleHref = chinese ? 'people_zh.html' : 'people.html';
    const displayName = chinese ? person.nameZh || person.name : person.name;
    const alternateName = chinese ? person.name : person.nameZh;
    const role = (person.status === 'alumni' ? chinese ? '过往成员 · ' : 'Alumni · ' : '') + (chinese ? person.roleZh || person.role || '' : person.role || '');
    const bio = chinese ? person.bioZh || person.bio : person.bio || person.bioZh;

    const hero = create('section', 'member-hero');
    const heroCopy = create('div', 'member-hero__copy');
    heroCopy.append(create('p', 'member-hero__role', role));
    heroCopy.append(create('h1', '', displayName));
    heroCopy.append(create('p', 'member-hero__alternate', alternateName));
    const back = create('a', 'profile-back', text.back);
    back.href = peopleHref;
    heroCopy.append(back);

    hero.append(heroCopy);
    if (person.image) {
      const portrait = create('figure', 'member-hero__portrait');
      const image = document.createElement('img');
      image.alt = chinese ? `${person.nameZh || person.name} (${person.name}) 的肖像` : `Portrait of ${person.name}`;
      image.src = person.image;
      image.style.objectPosition = person.objectPosition || '50% 50%';
      image.width = 1200;
      image.height = 1200;
      portrait.append(image);
      hero.append(portrait);
    } else {
      hero.classList.add('member-hero--text');
    }

    const detail = create('div', 'member-profile__detail');
    if (!bio) detail.classList.add('member-profile__detail--facts-only');
    const reading = create('section', 'member-profile__reading');
    if (bio) {
      reading.append(create('h2', '', text.profile));
      reading.append(create('p', '', bio));
    }

    const facts = create('aside', 'member-profile__facts');
    const education = create('section');
    education.append(create('h2', '', text.education));
    const educationList = create('ul');
    const entries = chinese && person.educationZh ? person.educationZh.split(/\n|(?=\d{4}年\d{1,2}月-)/) : person.education || [];
    entries.filter(Boolean).forEach((entry) => educationList.append(create('li', '', entry)));
    education.append(educationList);
    if (entries.length) facts.append(education);

    if (person.startMonth || person.endMonth) {
      const month = (value) => chinese ? `${value.slice(0, 4)}年${Number(value.slice(5))}月` : new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}-01T00:00:00Z`));
      const dates = person.startMonth ? `${month(person.startMonth)} – ${person.endMonth ? month(person.endMonth) : chinese ? '至今' : 'present'}` : `${chinese ? '截至' : 'Until '}${month(person.endMonth)}`;
      const time = create('section');
      time.append(create('h2', '', text.time), create('p', 'member-profile__period', dates));
      facts.append(time);
    }

    const contact = create('section');
    contact.append(create('h2', '', text.contact));
    const email = create('a', 'member-profile__email', person.email);
    email.href = `mailto:${person.email}`;
    contact.append(email);
    if (person.email) facts.append(contact);

    if (person.links?.length) {
      const links = create('section');
      links.append(create('h2', '', text.links));
      const linkList = create('div', 'member-profile__links');
      person.links.forEach((entry) => {
        const link = create('a', '', entry.label);
        link.href = entry.href;
        link.target = '_blank';
        link.rel = 'noreferrer';
        linkList.append(link);
      });
      links.append(linkList);
      facts.append(links);
    }

    detail.append(reading, facts);
    root.replaceChildren(hero, detail);
  });
})();
