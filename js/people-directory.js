(() => {
  const groupOrder = [
    { role: 'Postdoctoral Fellow', title: 'Postdoctoral Fellow', titleZh: '博士后' },
    { role: 'PhD Student', title: 'PhD Students', titleZh: '博士研究生' },
    { role: 'Research Assistant', title: 'Research Assistants', titleZh: '研究助理' },
    { role: 'Undergraduate Researcher', title: 'Undergraduate Researchers', titleZh: '本科生研究员' },
    { role: 'Research Intern', title: 'Research Intern', titleZh: '科研实习生' }
  ];

  const create = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
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
        const image = document.createElement('img');
        image.alt = chinese ? `${person.nameZh} (${person.name}) 的肖像` : `Portrait of ${person.name}`;
        image.decoding = 'async';
        image.loading = 'lazy';
        image.src = person.image;
        image.style.objectPosition = person.objectPosition;
        figure.append(image);

        const caption = create('span', 'people-person__caption');
        caption.append(create('strong', '', chinese ? person.nameZh : person.name));
        caption.append(create('span', '', chinese ? person.roleZh : person.role));
        link.append(figure, caption);
        grid.append(link);
      });

      section.append(heading, grid);
      root.append(section);
    });
  });
})();
