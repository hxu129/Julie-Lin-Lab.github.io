(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('member-form');
  const publicOrigin = `${location.protocol}//${location.hostname}/`;
  const fragment = new URLSearchParams(location.hash.slice(1));
  const editToken = fragment.get('edit') || '';
  const requestedMember = new URLSearchParams(location.search).get('member');
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);

  const roles = {
    'Postdoctoral Fellow': '博士后', 'PhD Student': '博士研究生', 'MPhil Student': '硕士研究生',
    'Research Assistant': '研究助理', 'Undergraduate Researcher': '本科生研究员',
    'Research Intern': '科研实习生', 'Technical & Administrative Assistant': '技术与行政助理'
  };
  const textFields = ['name', 'nameZh', 'email', 'bio', 'bioZh', 'educationZh', 'position', 'positionZh', 'nextPosition', 'nextPositionZh', 'startMonth', 'endMonth'];
  let session = null;
  let members = [];
  let record = null;
  let dirty = false;
  let busy = false;
  let creating = false;
  let pendingImage = '';

  document.querySelectorAll('.public-site-link').forEach((link) => { link.href = publicOrigin; });

  class ApiError extends Error {
    constructor(status, message) { super(message); this.status = status; }
  }

  const api = async (path, options = {}) => {
    const headers = new Headers(options.headers || {});
    if (editToken) headers.set('Authorization', `Bearer ${editToken}`);
    if (options.method && options.method !== 'GET') headers.set('X-Lin-Lab-Request', '1');
    if (options.body && typeof options.body !== 'string' && !(options.body instanceof File)) {
      headers.set('Content-Type', 'application/json');
      options.body = JSON.stringify(options.body);
    }
    let response;
    try { response = await fetch(path, { ...options, headers, credentials: 'same-origin', cache: 'no-store' }); }
    catch { throw new ApiError(0, '连接失败，请确认已连接 Tailscale，再重试。'); }
    let data;
    try { data = await response.json(); }
    catch { throw new ApiError(response.status, '服务没有返回可读取的资料，请稍后重试。'); }
    if (!response.ok) throw new ApiError(response.status, data.error || '操作失败，请稍后重试。');
    return data;
  };

  const notify = (message = '') => {
    $('status-message').textContent = message;
    $('status-message').hidden = !message;
  };
  const clearError = () => { $('error-message').hidden = true; $('error-message').textContent = ''; };
  const showError = (error) => {
    let message = error.message;
    if (error.status === 401 || error.status === 403) message = '无法访问这份资料。请先连接 Tailscale，并使用管理员账号或对应成员的专属编辑链接。';
    if (error.status === 409) message = '资料已被其他人更新，请重新载入后再保存。你尚未保存的内容仍保留在表单中。';
    $('error-message').textContent = message;
    $('error-message').hidden = false;
    $('error-message').scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const markDirty = () => {
    dirty = true;
    $('save-state').textContent = '有尚未保存的修改';
    $('save-help').textContent = '保存后，网站才会显示这些修改。';
  };
  const allowDiscard = () => !dirty || window.confirm('有尚未保存的修改。确定放弃这些修改吗？');
  const setBusy = (value) => {
    busy = value;
    form.querySelectorAll('fieldset').forEach((fieldset) => { fieldset.disabled = value; });
    ['save-record', 'reload-record', 'new-member', 'export-data', 'create-edit-link'].forEach((id) => { $(id).disabled = value; });
    $('member-search').disabled = value;
    $('member-filter').disabled = value;
    document.querySelectorAll('.member-option').forEach((button) => { button.disabled = value; });
    $('photo-file').disabled = value || creating;
    $('save-record').textContent = value ? '处理中…' : '保存并更新网页';
  };
  const groupForRole = (role) => ({ 'Research Intern': 'interns', 'Undergraduate Researcher': 'undergraduates', 'Postdoctoral Fellow': 'postdocs', 'PhD Student': 'graduates', 'MPhil Student': 'graduates' }[role] || 'assistants');
  const updateStatusFields = () => {
    const alumni = $('status').value === 'alumni';
    $('alumni-group-field').hidden = !alumni;
    $('end-required').hidden = !alumni;
    $('endMonth').required = alumni;
  };

  const showPortrait = (image) => {
    const preview = $('portrait-preview');
    preview.hidden = !image;
    $('portrait-placeholder').hidden = !!image;
    if (image) {
      preview.src = new URL(image, publicOrigin).href;
      preview.alt = `${record?.nameZh || record?.name || '成员'}的头像`;
      preview.style.objectPosition = record?.objectPosition || '50% 50%';
    } else preview.removeAttribute('src');
  };

  const renderList = () => {
    const query = $('member-search').value.trim().toLocaleLowerCase();
    const status = $('member-filter').value;
    const visible = members.filter((person) => (status === 'all' || person.status === status)
      && [person.name, person.nameZh, person.email].filter(Boolean).some((value) => value.toLocaleLowerCase().includes(query)));
    const list = $('member-list');
    list.replaceChildren();
    visible.forEach((person) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'member-option';
      button.setAttribute('aria-pressed', String(!creating && person.id === record?.id));
      const name = document.createElement('strong');
      name.textContent = person.nameZh ? `${person.nameZh} · ${person.name}` : person.name;
      const detail = document.createElement('span');
      detail.textContent = `${person.status === 'alumni' ? '过往成员' : '当前成员'} · ${person.roleZh || roles[person.role] || person.role}`;
      button.append(name, detail);
      button.disabled = busy;
      button.addEventListener('click', () => {
        if (!busy && allowDiscard()) loadMember(person.id);
      });
      list.append(button);
    });
    if (!visible.length) {
      const empty = document.createElement('p');
      empty.className = 'field-help';
      empty.textContent = '没有匹配的成员。';
      list.append(empty);
    }
    const current = members.filter((person) => person.status === 'current').length;
    $('member-count').textContent = `当前 ${current} 位 · 过往 ${members.length - current} 位${query || status !== 'all' ? ` · 找到 ${visible.length} 位` : ''}`;
  };

  const displayRecord = (person, isNew = false) => {
    record = person;
    creating = isNew;
    pendingImage = person.image || '';
    form.hidden = false;
    $('empty-state').hidden = true;
    textFields.forEach((field) => { $(field).value = person[field] || ''; });
    $('education').value = (person.education || []).join('\n');
    $('links').value = (person.links || []).map((link) => link.href).join('\n');
    $('role').value = person.role || 'PhD Student';
    $('status').value = person.status || 'current';
    $('alumniGroup').value = person.alumniGroup || groupForRole($('role').value);
    $('record-label').textContent = isNew ? '新增成员' : person.status === 'alumni' ? '过往成员资料' : '当前成员资料';
    $('member-title').textContent = isNew ? '新增成员' : person.nameZh ? `${person.nameZh} · ${person.name}` : person.name;
    $('sharing-panel').hidden = !session.admin || isNew;
    $('edit-link-result').hidden = true;
    $('edit-link').value = '';
    $('create-edit-link').textContent = '生成专属编辑链接';
    $('photo-file').value = '';
    $('photo-file').disabled = isNew;
    $('photo-help').textContent = isNew ? '请先保存新成员资料，再上传头像。' : '支持 JPG、PNG、WebP，最大 5 MB。上传后请保存资料。';
    $('destination-details').open = person.status === 'alumni' || !!person.position || !!person.nextPosition;
    $('profile-preview').hidden = isNew;
    if (!isNew) $('profile-preview').href = new URL(`profile.html?member=${encodeURIComponent(person.id)}&lang=zh`, publicOrigin).href;
    showPortrait(pendingImage);
    updateStatusFields();
    dirty = false;
    $('save-state').textContent = isNew ? '填写后创建成员资料' : '资料已载入';
    $('save-help').textContent = '保存会直接更新网站。';
    clearError();
    renderList();
  };

  const loadMember = async (id) => {
    setBusy(true);
    clearError();
    notify('正在载入成员资料…');
    try {
      const person = await api(`/api/members/${encodeURIComponent(id)}`);
      displayRecord(person);
      notify();
    } catch (error) { notify(); showError(error); }
    finally { setBusy(false); }
  };

  const collectRecord = () => {
    const payload = {};
    textFields.forEach((field) => { payload[field] = $(field).value.trim(); });
    payload.role = $('role').value;
    payload.roleZh = payload.role === record.role && record.roleZh ? record.roleZh : roles[payload.role];
    payload.status = $('status').value;
    payload.alumniGroup = $('alumniGroup').value;
    payload.education = $('education').value.split('\n').map((line) => line.trim()).filter(Boolean);
    const oldLinks = new Map((record.links || []).map((link) => [link.href, link]));
    payload.links = $('links').value.split('\n').map((line) => line.trim()).filter(Boolean).map((href) => oldLinks.get(href) || { label: 'Academic profile', href });
    payload.image = pendingImage;
    payload.objectPosition = record.objectPosition || '50% 50%';
    return payload;
  };

  form.addEventListener('input', (event) => {
    if (event.target !== $('photo-file')) markDirty();
  });
  form.addEventListener('change', (event) => {
    if (event.target === $('photo-file')) return;
    markDirty();
    if (event.target === $('status')) updateStatusFields();
    if (event.target === $('role')) $('alumniGroup').value = groupForRole($('role').value);
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    const payload = collectRecord();
    if (payload.startMonth && payload.endMonth && payload.endMonth < payload.startMonth) {
      showError(new Error('结束月份不能早于开始月份。'));
      $('endMonth').focus();
      return;
    }
    setBusy(true);
    clearError();
    notify('正在保存并更新网页…');
    try {
      const saved = creating
        ? await api('/api/members', { method: 'POST', body: payload })
        : await api(`/api/members/${encodeURIComponent(record.id)}`, { method: 'PUT', body: { version: record.version, record: payload } });
      const index = members.findIndex((person) => person.id === saved.id);
      if (index < 0) members.push(saved); else members[index] = saved;
      displayRecord(saved);
      $('save-state').textContent = '已保存，网页已更新';
      notify('资料已保存，实验室网站已同步更新。');
    } catch (error) { notify(); showError(error); }
    finally { setBusy(false); }
  });

  $('reload-record').addEventListener('click', () => {
    if (busy || !allowDiscard()) return;
    if (creating) displayRecord({ role: 'PhD Student', status: 'current', education: [], links: [] }, true);
    else loadMember(record.id);
  });
  $('new-member').addEventListener('click', () => {
    if (busy || !allowDiscard()) return;
    displayRecord({ role: 'PhD Student', status: 'current', education: [], links: [] }, true);
    notify();
    $('member-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('name').focus({ preventScroll: true });
  });
  $('member-search').addEventListener('input', renderList);
  $('member-filter').addEventListener('change', renderList);

  $('photo-file').addEventListener('change', async () => {
    const file = $('photo-file').files[0];
    if (!file || busy || creating) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      showError(new Error('请选择不超过 5 MB 的 JPG、PNG 或 WebP 图片。'));
      $('photo-file').value = '';
      return;
    }
    setBusy(true);
    clearError();
    notify('正在上传头像…');
    try {
      const result = await api(`/api/members/${encodeURIComponent(record.id)}/photo`, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
      pendingImage = result.image;
      showPortrait(pendingImage);
      markDirty();
      $('photo-help').textContent = '新头像已上传。请保存资料，让新头像显示在网站上。';
      notify('头像已上传，请保存资料以完成更新。');
    } catch (error) { notify(); showError(error); }
    finally { $('photo-file').value = ''; setBusy(false); }
  });

  $('create-edit-link').addEventListener('click', async () => {
    if (busy || creating) return;
    if ($('edit-link').value && !window.confirm('重新生成会使旧的专属编辑链接失效。确定继续吗？')) return;
    setBusy(true);
    clearError();
    try {
      const result = await api(`/api/members/${encodeURIComponent(record.id)}/edit-link`, { method: 'POST', body: {} });
      $('edit-link').value = result.url;
      $('edit-link-result').hidden = false;
      $('create-edit-link').textContent = '重新生成编辑链接';
      notify('专属编辑链接已生成。请只交给这位成员；对方需要连接 Tailscale。');
    } catch (error) { showError(error); }
    finally { setBusy(false); }
  });
  $('copy-link').addEventListener('click', async () => {
    const input = $('edit-link');
    try {
      await navigator.clipboard.writeText(input.value);
      notify('编辑链接已复制。');
    } catch {
      input.focus(); input.select();
      notify('链接已选中，请按复制快捷键，或长按复制。');
    }
  });

  $('export-data').addEventListener('click', async () => {
    if (busy) return;
    setBusy(true);
    clearError();
    try {
      const data = await api('/api/export');
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const download = document.createElement('a');
      download.href = url;
      download.download = `lin-lab-members-${new Intl.DateTimeFormat('sv-SE').format(new Date())}.json`;
      download.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('资料备份已导出。尚未保存的表单修改不会包含在备份中。');
    } catch (error) { showError(error); }
    finally { setBusy(false); }
  });

  window.addEventListener('beforeunload', (event) => {
    if (dirty) { event.preventDefault(); event.returnValue = ''; }
  });
  document.querySelectorAll('.public-site-link').forEach((link) => {
    if (!link.target) link.addEventListener('click', (event) => {
      if (!allowDiscard()) event.preventDefault();
      else dirty = false;
    });
  });

  const initialize = async () => {
    clearError();
    notify('正在载入资料…');
    $('retry-session').hidden = true;
    try {
      session = await api('/api/session');
      $('session-label').textContent = `${session.admin ? '管理员' : '专属编辑'} · ${session.login}`;
      $('workspace').hidden = false;
      $('member-sidebar').hidden = !session.admin;
      $('workspace').classList.toggle('workspace--self', !session.admin);
      if (session.admin) {
        const result = await api('/api/members');
        members = result.members;
        renderList();
        if (members.length) await loadMember(members.find((person) => person.id === requestedMember)?.id || members[0].id);
        else { $('empty-state').hidden = false; notify(); }
      } else if (session.memberId) {
        await loadMember(session.memberId);
      } else {
        throw new ApiError(403, '请使用对应成员的专属编辑链接。');
      }
    } catch (error) {
      notify();
      $('session-label').textContent = '尚未获得访问权限';
      $('workspace').hidden = true;
      $('retry-session').hidden = false;
      showError(error);
    }
  };
  $('retry-session').addEventListener('click', initialize);
  initialize();
})();
