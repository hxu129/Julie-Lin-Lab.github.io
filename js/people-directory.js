(() => {
  const groupOrder = [
    { role: 'Postdoctoral Fellow', title: 'Postdoctoral Fellow', titleZh: '博士后' },
    { role: 'PhD Student', title: 'PhD Students', titleZh: '博士研究生' },
    { role: 'MPhil Student', title: 'MPhil Students', titleZh: '研究型硕士生' },
    { role: 'Research Assistant', title: 'Research Assistants', titleZh: '研究助理' },
    { role: 'Technical & Administrative Assistant', title: 'Technical & Administrative Assistants', titleZh: '技术与行政助理' },
    { role: 'Undergraduate Researcher', title: 'Undergraduate Researchers', titleZh: '本科生研究员' },
    { role: 'Research Intern', title: 'Research Intern', titleZh: '科研实习生' }
  ];

  const create = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const period = (person, chinese) => {
    const month = (value) => chinese ? `${value.slice(0, 4)}年${Number(value.slice(5))}月` : new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}-01T00:00:00Z`));
    if (person.startMonth) return `${month(person.startMonth)} – ${person.endMonth ? month(person.endMonth) : chinese ? '至今' : 'present'}`;
    return person.endMonth ? `${chinese ? '截至' : 'Until '}${month(person.endMonth)}` : '';
  };

  const appendName = (entry, person, prefix, chinese, href) => {
    const name = create('h4', `${prefix}__name`);
    const displayName = chinese && person.nameZh ? person.nameZh : person.name;
    if (href) {
      const link = create('a', '', displayName);
      link.href = href;
      name.append(link);
    } else {
      name.textContent = displayName;
    }
    entry.append(name);
    if (person.nameZh) {
      entry.append(create('span', `${prefix}__alternate`, chinese ? person.name : person.nameZh));
    }
  };

  const renderAlumni = (root, alumni, chinese) => {
    if (!root || !Array.isArray(alumni)) return;
    root.replaceChildren();
    [
      { id: 'interns', title: 'Research Interns', titleZh: '科研实习生' },
      { id: 'assistants', title: 'Technical & Administrative Assistants', titleZh: '技术与行政助理' },
      { id: 'undergraduates', title: 'HKUST(GZ) Undergraduates', titleZh: '香港科技大学（广州）本科生' },
      { id: 'graduates', title: 'Graduate Students', titleZh: '硕博研究生' },
      { id: 'postdocs', title: 'Postdoctoral Fellows', titleZh: '博士后' }
    ].forEach((group) => {
      const members = alumni.filter((person) => person.group === group.id);
      if (!members.length) return;
      const section = create('section', 'alumni-group');
      const heading = create('h3', 'alumni-group__title', chinese ? group.titleZh : group.title);
      const list = create('div', 'alumni-group__list');
      list.setAttribute('role', 'list');
      members.forEach((person) => {
        const entry = create('article', 'alumni-entry');
        entry.setAttribute('role', 'listitem');
        const hasProfile = person.bio || person.bioZh || person.image || person.email || person.education?.length || person.educationZh || person.links?.length;
        const profile = hasProfile ? `profile.html?member=${encodeURIComponent(person.id)}${chinese ? '&lang=zh' : ''}` : chinese ? person.profileZh : person.profile;
        appendName(entry, person, 'alumni-entry', chinese, profile);
        entry.append(create('p', 'alumni-entry__period', period(person, chinese) || (chinese ? person.periodZh : person.period)));
        if (person.nextPosition || person.nextPositionZh) {
          entry.append(create('p', 'alumni-entry__position', chinese
            ? `去向：${person.nextPositionZh || person.nextPosition}` : `Next position: ${person.nextPosition || person.nextPositionZh}`));
        }
        if (person.position || person.positionZh) {
          const label = chinese ? (person.nextPosition || person.nextPositionZh || person.group === 'assistants' ? '目前：' : '去向：') : 'Current position: ';
          entry.append(create('p', 'alumni-entry__position', label + (chinese ? person.positionZh || person.position : person.position || person.positionZh)));
        }
        list.append(entry);
      });
      section.append(heading, list);
      root.append(section);
    });
  };

  const renderCollaborators = (root, collaborators, chinese) => {
    if (!root || !Array.isArray(collaborators)) return;
    root.replaceChildren();
    [
      { id: 'hkust', title: 'HKUST(GZ) / HKUST Collaborators', titleZh: '香港科技大学（广州）/ 香港科技大学合作者' },
      { id: 'external', title: 'External Collaborators', titleZh: '外部合作者' }
    ].forEach((group) => {
      const members = collaborators.filter((person) => person.group === group.id);
      if (!members.length) return;
      const section = create('section', 'collaborator-group');
      const heading = create('h3', 'collaborator-group__title', chinese ? group.titleZh : group.title);
      const list = create('div', 'collaborator-group__list');
      list.setAttribute('role', 'list');
      members.forEach((person) => {
        const entry = create('article', 'collaborator-entry');
        entry.setAttribute('role', 'listitem');
        appendName(entry, person, 'collaborator-entry', chinese, person.href);
        entry.append(create('p', '', chinese ? person.affiliationZh : person.affiliation));
        list.append(entry);
      });
      section.append(heading, list);
      root.append(section);
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector('[data-people-directory]');
    const people = window.LIN_LAB_PEOPLE;
    if (!root || !Array.isArray(people)) return;

    const chinese = document.documentElement.lang.toLowerCase().startsWith('zh');
    root.replaceChildren();

    groupOrder.forEach((group) => {
      const members = people.filter((person) => person.role === group.role);
      if (!members.length) return;

      const section = create('section', 'people-group');
      const heading = create('h2', 'people-group__title', chinese ? group.titleZh : group.title);
      const grid = create('div', 'people-group__grid');
      grid.setAttribute('role', 'list');

      members.forEach((person) => {
        const link = create('a', 'people-person');
        link.href = `profile.html?member=${encodeURIComponent(person.id)}${chinese ? '&lang=zh' : ''}`;
        link.setAttribute('role', 'listitem');
        link.setAttribute('aria-label', chinese ? `查看${person.nameZh}的个人资料` : `Read ${person.name}'s profile`);

        const figure = create('figure', 'people-person__portrait');
        if (person.image) {
          const image = document.createElement('img');
          image.alt = chinese ? `${person.nameZh || person.name} (${person.name}) 的肖像` : `Portrait of ${person.name}`;
          image.decoding = 'async';
          image.loading = 'lazy';
          image.src = person.image;
          image.style.objectPosition = person.objectPosition || '50% 50%';
          figure.append(image);
        } else {
          const initials = create('span', 'people-person__initials', person.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join(''));
          initials.setAttribute('aria-hidden', 'true');
          figure.append(initials);
        }

        const caption = create('span', 'people-person__caption');
        caption.append(create('strong', '', chinese ? person.nameZh || person.name : person.name));
        caption.append(create('span', '', chinese ? person.roleZh : person.role));
        const dates = period(person, chinese);
        if (dates) caption.append(create('span', 'people-person__period', dates));
        link.append(figure, caption);
        grid.append(link);
      });

      section.append(heading, grid);
      root.append(section);
    });

    renderAlumni(document.querySelector('[data-alumni-directory]'), window.LIN_LAB_ALUMNI, chinese);
    renderCollaborators(document.querySelector('[data-collaborator-directory]'), window.LIN_LAB_COLLABORATORS, chinese);
  });
})();
