(() => {
  const createElement = (tag, className, content) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.innerHTML = content;
    return element;
  };

  const backgroundUrl = (element) => {
    const value = element?.style.backgroundImage || '';
    const match = value.match(/url\(["']?(.*?)["']?\)/);
    return match ? match[1] : '';
  };

  const labelForLink = (href) => {
    if (href.startsWith('mailto:')) return 'Email';
    if (href.includes('linkedin')) return 'LinkedIn';
    if (href.includes('github')) return 'GitHub';
    if (href.includes('twitter') || href.includes('x.com')) return 'X';
    if (href.includes('instagram')) return 'Instagram';
    return 'Profile';
  };

  const canonicalProfiles = {
    'about.html': { name: 'Jianning Kang', role: 'PhD Student (Tsinghua University), Web Developer' },
    'about_Julie.html': { name: 'Julie Qiaojin Lin, Ph.D.', role: 'Assistant Professor' },
    'about_linkuo.html': { name: 'Linkuo Shang', role: 'PhD Student' },
    'about_menglin.html': { name: 'Menglin Dai', role: 'PhD Student' },
    'about_rui.html': { name: 'Rui Feng', role: 'PhD Student' },
    'about_shuhan.html': { name: 'Shuhan Shen', role: 'PhD Student' },
    'about_xuanxuan.html': { name: 'Xuanxuan Tang', role: 'PhD Student' },
    'about_yaping.html': { name: 'Yaping Wu', role: 'PhD Student' },
    'about_yi.html': { name: 'Yi Hu', role: 'MPhil Student' },
    'about_yihua.html': { name: 'Yihua Gao', role: 'MPhil Student' },
    'about_zixin.html': { name: 'Zixin Sun', role: 'PhD Student' }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const legacyMain = document.querySelector('#colorlib-main');
    const nameElement = legacyMain?.querySelector('h1');
    if (!legacyMain || !nameElement) return;

    const record = canonicalProfiles[window.location.pathname.split('/').pop()] || {};
    const name = record.name || nameElement.textContent.trim();
    const role = record.role || (document.title.split('|')[1] || 'Lab member').trim();
    const profileImageUrl = backgroundUrl(legacyMain.querySelector('.img[style*="background-image"]'));
    const contentBlocks = [...legacyMain.querySelectorAll('.desc > h5')];
    const trajectory = contentBlocks.find((block) => block.querySelector('li'));
    const narrative = contentBlocks.filter((block) => block !== trajectory);
    const socialLinks = [...legacyMain.querySelectorAll('.ftco-social a')]
      .map((link) => ({ href: link.href, label: labelForLink(link.href) }));

    const header = createElement('header', 'site-header');
    header.innerHTML = `<div class="site-header__inner"><a class="wordmark" href="index.html" aria-label="Lin Lab home">Lin Lab <small>Neuronal RNA Metabolism Lab<br>HKUST(GZ)</small></a><button class="menu-toggle" type="button" aria-controls="site-navigation" aria-expanded="false">Menu</button><nav class="site-nav" id="site-navigation" aria-label="Primary navigation"><a href="research.html">Research</a><a href="publication.html">Publications</a><a aria-current="page" href="people.html">People</a><a href="photography.html">News</a><a href="contact.html">Join us</a></nav></div>`;

    const main = createElement('main', 'profile-shell');
    const hero = createElement('section', 'profile-hero');
    hero.innerHTML = `<div class="profile-hero__copy"><p class="profile-kicker">${role}</p><h1>${name}</h1><a class="profile-back" href="people.html">Back to people</a></div><figure class="profile-hero__art" aria-hidden="true"><img src="images/illustrations/rna-field-notes-research.webp" alt="" width="1536" height="1024"></figure>`;

    const content = createElement('div', 'profile-content');
    const aside = createElement('aside', 'profile-aside');
    if (profileImageUrl) aside.innerHTML += `<figure class="profile-portrait"><img src="${profileImageUrl}" alt="Portrait of ${name}"></figure>`;
    if (socialLinks.length) {
      const links = createElement('div', 'profile-links');
      socialLinks.forEach(({ href, label }) => links.insertAdjacentHTML('beforeend', `<a href="${href}">${label}</a>`));
      aside.append(links);
    }

    const reading = createElement('div', 'profile-reading');
    if (trajectory) reading.insertAdjacentHTML('beforeend', `<section><h2>Background</h2>${trajectory.outerHTML}</section>`);
    if (narrative.length) reading.insertAdjacentHTML('beforeend', `<section><h2>In their own words</h2>${narrative.map((block) => block.outerHTML).join('')}</section>`);
    if (!reading.children.length) reading.innerHTML = '<section><h2>Profile</h2></section>';
    content.append(aside, reading);
    main.append(hero, content);

    const footer = createElement('footer', 'site-footer');
    footer.innerHTML = '<div class="site-footer__inner"><a class="wordmark" href="index.html">Lin Lab <small>Neuronal RNA Metabolism Lab<br>HKUST(GZ)</small></a><p>No.1 Du Xue Rd, Nansha District, Guangzhou<br><a href="mailto:qiaojinlin@hkust-gz.edu.cn">qiaojinlin@hkust-gz.edu.cn</a></p><div class="site-footer__links"><a href="research.html">Research</a><a href="publication.html">Publications</a><a href="people.html">People</a></div></div>';

    document.body.className = 'site-body profile-body';
    document.body.replaceChildren(header, main, footer);
    const menuButton = header.querySelector('.menu-toggle');
    const navigation = header.querySelector('.site-nav');
    menuButton.addEventListener('click', () => {
      const open = navigation.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
  });
})();
