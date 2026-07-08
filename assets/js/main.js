/* ============================================================================
   Ubuntu desktop portfolio — window manager + interactive terminal
   ========================================================================== */
(function () {
  'use strict';

  var isDesktop = document.body.classList.contains('ubuntu-desktop');
  if (!isDesktop) return; // blog/other pages don't need this

  var DATA = {};
  try { DATA = JSON.parse(document.getElementById('site-data').textContent); } catch (e) {}

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(max-width: 760px)').matches;
  var zTop = 100;
  var openCount = 0;

  /* ---------------------------------------------------------------- clock */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tickClock() {
    var d = new Date();
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var day = document.getElementById('clock-day');
    var time = document.getElementById('clock-time');
    if (day) day.textContent = days[d.getDay()] + ' ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
    if (time) time.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  tickClock();
  setInterval(tickClock, 15000);

  /* ---------------------------------------------------------------- windows */
  function winEl(name) { return document.querySelector('[data-window="' + name + '"]'); }
  function dockItem(name) { return document.querySelector('.dock-item[data-open="' + name + '"]'); }

  function focusWindow(el) {
    document.querySelectorAll('.window.is-focused').forEach(function (w) { w.classList.remove('is-focused'); });
    el.classList.add('is-focused');
    el.style.zIndex = ++zTop;
  }

  function placeWindow(el) {
    if (el.dataset.placed) return;
    el.dataset.placed = '1';
    if (isTouch) return; // CSS fills screen on mobile
    var area = document.getElementById('windows').getBoundingClientRect();
    var offset = (openCount % 6) * 32;
    var w = el.offsetWidth || 700;
    var left = Math.max(16, (area.width - w) / 2 - 40 + offset);
    var top = 28 + offset;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }

  function openWindow(name) {
    var el = winEl(name);
    if (!el) return;
    var wasHidden = el.hidden;
    el.hidden = false;
    if (wasHidden) { openCount++; placeWindow(el); }
    el.classList.remove('is-min');
    el.style.display = '';
    focusWindow(el);
    var di = dockItem(name);
    if (di) di.classList.add('is-running');
    hideHint();
    if (name === 'skills') animateMeters(el);
    if (name === 'terminal') focusTerminalInput();
  }

  function closeWindow(el) {
    el.hidden = true;
    el.dataset.placed = '';
    var name = el.dataset.window;
    var di = dockItem(name);
    if (di) di.classList.remove('is-running');
  }

  function minimizeWindow(el) {
    el.hidden = true; // simple minimize: hide but keep dock running dot
  }

  function toggleMax(el) {
    if (isTouch) return;
    el.classList.toggle('is-max');
  }

  // Controls
  document.addEventListener('click', function (e) {
    var openTrigger = e.target.closest('[data-open]');
    if (openTrigger) {
      var nm = openTrigger.getAttribute('data-open');
      if (winEl(nm)) { openWindow(nm); e.preventDefault(); return; }
    }

    var ctrl = e.target.closest('[data-win-action]');
    if (ctrl) {
      var win = ctrl.closest('.window');
      var action = ctrl.getAttribute('data-win-action');
      if (action === 'close') closeWindow(win);
      else if (action === 'minimize') minimizeWindow(win);
      else if (action === 'maximize') toggleMax(win);
      e.stopPropagation();
      return;
    }
  });

  // Focus on interaction + double-click titlebar to maximize
  document.querySelectorAll('.window').forEach(function (el) {
    el.addEventListener('mousedown', function () { focusWindow(el); });
    var bar = el.querySelector('[data-drag-handle]');
    if (bar) {
      bar.addEventListener('dblclick', function (e) {
        if (!e.target.closest('.win-controls')) toggleMax(el);
      });
    }
  });

  /* ---------------------------------------------------------------- dragging */
  function makeDraggable(el) {
    var bar = el.querySelector('[data-drag-handle]');
    if (!bar) return;
    var sx, sy, ox, oy, dragging = false;

    bar.addEventListener('mousedown', function (e) {
      if (isTouch || el.classList.contains('is-max')) return;
      if (e.target.closest('.win-controls')) return;
      dragging = true;
      var r = el.getBoundingClientRect();
      var area = document.getElementById('windows').getBoundingClientRect();
      ox = r.left - area.left; oy = r.top - area.top;
      sx = e.clientX; sy = e.clientY;
      el.style.left = ox + 'px'; el.style.top = oy + 'px';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var area = document.getElementById('windows').getBoundingClientRect();
      var nx = ox + (e.clientX - sx);
      var ny = oy + (e.clientY - sy);
      nx = Math.max(-el.offsetWidth + 90, Math.min(nx, area.width - 60));
      ny = Math.max(0, Math.min(ny, area.height - 40));
      el.style.left = nx + 'px'; el.style.top = ny + 'px';
    });

    window.addEventListener('mouseup', function () {
      dragging = false; document.body.style.userSelect = '';
    });
  }
  document.querySelectorAll('.window').forEach(makeDraggable);

  /* ---------------------------------------------------------------- desktop icons */
  document.querySelectorAll('.desk-icon').forEach(function (icon) {
    if (isTouch) {
      icon.addEventListener('click', function () {
        var nm = icon.getAttribute('data-open');
        if (winEl(nm)) openWindow(nm);
      });
    } else {
      icon.addEventListener('click', function () {
        document.querySelectorAll('.desk-icon.is-selected').forEach(function (i) { i.classList.remove('is-selected'); });
        icon.classList.add('is-selected');
      });
      icon.addEventListener('dblclick', function () {
        var nm = icon.getAttribute('data-open');
        if (winEl(nm)) openWindow(nm);
      });
    }
  });

  /* ---------------------------------------------------------------- status menu */
  var statusMenu = document.getElementById('status-menu');
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-action]');
    if (t && t.getAttribute('data-action') === 'toggle-menu') {
      statusMenu.hidden = !statusMenu.hidden;
      e.stopPropagation();
      return;
    }
    if (t && t.getAttribute('data-action') === 'restart') { restart(); return; }
    if (t && t.getAttribute('data-action') === 'show-apps') { openWindow('projects'); return; }
    if (statusMenu && !statusMenu.hidden && !e.target.closest('.topbar-tray')) statusMenu.hidden = true;
  });

  function restart() {
    document.querySelectorAll('.window').forEach(function (el) { closeWindow(el); });
    if (statusMenu) statusMenu.hidden = true;
    var boot = document.getElementById('boot');
    if (boot) { boot.classList.remove('is-done'); }
    termBooted = false;
    var out = document.getElementById('term-output');
    if (out) out.innerHTML = '';
    runBoot();
  }

  /* ---------------------------------------------------------------- skill meters */
  function animateMeters(el) {
    el.querySelectorAll('.skill-meter span').forEach(function (bar) {
      var target = bar.style.width || '80%';
      if (reduceMotion) { bar.style.width = target; return; }
      bar.style.width = '0';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { bar.style.width = target; });
      });
    });
  }

  /* ---------------------------------------------------------------- hint */
  function hideHint() {
    var h = document.getElementById('desktop-hint');
    if (h) h.style.opacity = '0';
  }

  /* ---------------------------------------------------------------- mail form */
  var mailForm = document.querySelector('[data-mail-form]');
  if (mailForm) {
    mailForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var to = mailForm.getAttribute('data-to');
      var subject = encodeURIComponent(mailForm.subject.value || 'Hello');
      var from = mailForm.from.value ? '\n\nFrom: ' + mailForm.from.value : '';
      var body = encodeURIComponent((mailForm.body.value || '') + from);
      window.location.href = 'mailto:' + to + '?subject=' + subject + '&body=' + body;
    });
  }

  /* ============================================================================
     Interactive terminal
     ========================================================================== */
  var out = document.getElementById('term-output');
  var input = document.getElementById('term-input');
  var promptUser = (DATA.profile && DATA.profile.username || 'sam') + '@' + (DATA.profile && DATA.profile.host || 'portfolio');
  var history = [];
  var histIdx = -1;
  var termBooted = false;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function print(html, cls) {
    if (!out) return;
    var div = document.createElement('div');
    div.className = 'line' + (cls ? ' ' + cls : '');
    div.innerHTML = html;
    out.appendChild(div);
    var body = out.closest('.term-body');
    if (body) body.scrollTop = body.scrollHeight;
  }

  function printPromptEcho(cmd) {
    print('<span class="term-prompt"><span class="term-user">' + esc(promptUser) + '</span>:<span class="term-path">~</span>$</span> ' + esc(cmd));
  }

  function focusTerminalInput() {
    if (input && !isTouch) setTimeout(function () { input.focus(); placeCaret(input); }, 30);
  }
  function placeCaret(el) {
    try {
      var r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    } catch (e) {}
  }

  var COMMANDS = {
    help: function () {
      print('Available commands:', 't-orange');
      var cmds = [
        ['about', 'who I am'],
        ['whoami', 'the short version'],
        ['projects', 'featured work (or: open projects)'],
        ['experience', 'career history'],
        ['skills', 'the toolkit'],
        ['contact', 'get in touch'],
        ['neofetch', 'system info'],
        ['ls', 'list files'],
        ['open <app>', 'launch a window'],
        ['social', 'links'],
        ['clear', 'clear the screen'],
        ['help', 'this list']
      ];
      cmds.forEach(function (c) {
        print('  <span class="t-green">' + c[0] + '</span>' + '&nbsp;'.repeat(Math.max(1, 14 - c[0].length)) + '<span class="t-muted">' + c[1] + '</span>');
      });
    },
    about: function () {
      (DATA.profile.bio || []).forEach(function (p) { print(esc(p)); });
      print('');
      print('<span class="t-muted">tip: type</span> <span class="t-green">open about</span> <span class="t-muted">for the full window.</span>');
    },
    whoami: function () {
      print('<span class="t-green">' + esc(DATA.profile.name) + '</span> — ' + esc(DATA.profile.role));
    },
    neofetch: function () {
      var facts = (DATA.profile.facts || []).map(function (f) {
        return '<div class="nf-row"><span class="nf-key">' + esc(f[0]) + '</span> ' + esc(f[1]) + '</div>';
      }).join('');
      var infoHead = '<div class="nf-title">' + esc(promptUser) + '</div>' +
                     '<div class="nf-rule">' + '-'.repeat(promptUser.length) + '</div>';

      if (isTouch) { // Narrow screens: skip the ASCII art, just list the facts.
        print('<div class="nf-info">' + infoHead + facts + '</div>');
        return;
      }

      var art =
        '        .-/+oossssoo+/-.\n' +
        '    `:+ssssssssssssssssss+:`\n' +
        '  -+ssssssssssssssssssyyssss+-\n' +
        ' .osssssssssssssssssssdMMMNysssso.\n' +
        ' +sssssssssshdmmNNmmyNMMMMhssssss+\n' +
        'ossyNMMMNyMMhsssssssssssssshmmmhsss.\n' +
        '+sssshhhyNMMNyssssssssssssssssyNMMMy\n' +
        '.sssssssssdMMMNysssssssssssssshNMMMds.\n' +
        ' +sssssssssdmydMMMMMMMMddddyssssssss+\n' +
        '  -+sssssssssssssssssyyyyssssssss+-\n' +
        '    `:+ssssssssssssssssss+:`\n' +
        '        .-/+oossssoo+/-.';

      print('<div class="nf"><pre class="nf-logo">' + art + '</pre>' +
            '<div class="nf-info">' + infoHead + facts + '</div></div>');
    },
    ls: function () {
      print('<span class="t-blue">about.txt</span>   <span class="t-blue">experience/</span>   <span class="t-blue">projects/</span>   <span class="t-blue">skills/</span>   <span class="t-blue">contact/</span>   resume.pdf');
    },
    projects: function () {
      (DATA.projects || []).filter(function (p) { return p.featured; }).forEach(function (p) {
        print('<span class="t-green">▸ ' + esc(p.name) + '</span> — ' + esc(p.blurb));
        if (p.metric) print('   <span class="t-orange">' + esc(p.metric) + '</span>');
        if (p.stack) print('   <span class="t-muted">' + esc(p.stack.join(' · ')) + '</span>');
      });
      print('');
      print('<span class="t-muted">→</span> <span class="t-green">open projects</span> <span class="t-muted">for the file browser.</span>');
    },
    experience: function () {
      (DATA.experience || []).forEach(function (j) {
        print('<span class="t-orange">' + esc(j.start + ' – ' + j.end) + '</span>  <span class="t-green">' + esc(j.role) + '</span> <span class="t-muted">· ' + esc(j.org) + '</span>');
      });
      print('');
      print('<span class="t-muted">→</span> <span class="t-green">open experience</span>');
    },
    skills: function () {
      (DATA.skills || []).forEach(function (s) {
        print('<span class="t-green">' + esc(s.group) + '</span>: <span class="t-muted">' + esc(s.detail) + '</span>');
      });
      print('');
      print('<span class="t-muted">→</span> <span class="t-green">open skills</span>');
    },
    social: function () {
      (DATA.social || []).forEach(function (s) {
        var url = s.url.replace('mailto:', '');
        print('<span class="t-green">' + esc(s.label) + '</span>: <a href="' + esc(s.url) + '"' + (s.url.indexOf('mailto') === 0 ? '' : ' target="_blank" rel="noopener"') + '>' + esc(url) + '</a>');
      });
    },
    contact: function () { COMMANDS.social(); print(''); print('<span class="t-muted">→</span> <span class="t-green">open contact</span>'); },
    date: function () { print(new Date().toString()); },
    echo: function (args) { print(esc(args.join(' '))); },
    clear: function () { if (out) out.innerHTML = ''; },
    sudo: function () { print('<span class="t-orange">' + esc(promptUser.split('@')[0]) + '</span> is not in the sudoers file. This incident will be reported. 😏'); },
    open: function (args) {
      var nm = (args[0] || '').toLowerCase();
      var map = { about: 'about', projects: 'projects', experience: 'experience', exp: 'experience', skills: 'skills', contact: 'contact', terminal: 'terminal', trash: 'trash' };
      if (map[nm]) { openWindow(map[nm]); print('opening <span class="t-green">' + esc(nm) + '</span>…'); }
      else print('open: unknown app: ' + esc(nm) + ' <span class="t-muted">(try: about, projects, experience, skills, contact)</span>');
    }
  };
  COMMANDS.cat = function (args) {
    var f = (args[0] || '').replace(/\.txt$/, '');
    if (f === 'about' || f === '') return COMMANDS.about();
    if (COMMANDS[f]) return COMMANDS[f]();
    print('cat: ' + esc(args[0] || '') + ': No such file');
  };

  function runCommand(raw) {
    var cmd = raw.trim();
    if (!cmd) { print(''); return; }
    history.push(cmd); histIdx = history.length;
    var parts = cmd.split(/\s+/);
    var name = parts[0].toLowerCase();
    var args = parts.slice(1);
    if (COMMANDS[name]) COMMANDS[name](args);
    else print('<span class="t-orange">' + esc(name) + '</span>: command not found. Type <span class="t-green">help</span>.');
  }

  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var cmd = input.textContent;
        printPromptEcho(cmd);
        input.textContent = '';
        runCommand(cmd);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (histIdx > 0) { histIdx--; input.textContent = history[histIdx]; placeCaret(input); }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (histIdx < history.length - 1) { histIdx++; input.textContent = history[histIdx]; placeCaret(input); }
        else { histIdx = history.length; input.textContent = ''; }
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault(); COMMANDS.clear();
      }
    });
    // clicking anywhere in the terminal focuses the input
    var tbody = document.querySelector('.term-body');
    if (tbody) tbody.addEventListener('click', function (e) {
      if (!window.getSelection().toString()) input.focus();
    });
  }

  // Auto-typed intro when terminal first opens
  function typeInto(text, done) {
    if (reduceMotion || isTouch) { print(''); COMMANDS.neofetch(); done && done(); return; }
    var line = document.querySelector('.term-inputline');
    line.classList.add('typing');
    var i = 0;
    (function step() {
      if (i <= text.length) {
        input.textContent = text.slice(0, i);
        i++;
        setTimeout(step, 55);
      } else {
        setTimeout(function () {
          printPromptEcho(text);
          input.textContent = '';
          line.classList.remove('typing');
          runCommand(text);
          done && done();
        }, 250);
      }
    })();
  }

  function bootTerminal() {
    if (termBooted) return;
    termBooted = true;
    print('Welcome to <span class="t-orange">' + esc(DATA.profile.name) + '</span>\'s portfolio — an Ubuntu-style desktop.', 't-muted');
    typeInto('neofetch', function () {
      print('');
      print('Type <span class="t-green">help</span> to explore, or click the dock icons. <span class="t-muted">Try</span> <span class="t-green">open projects</span>.');
      focusTerminalInput();
    });
  }

  /* ---------------------------------------------------------------- boot */
  function runBoot() {
    var boot = document.getElementById('boot');
    var delay = reduceMotion ? 400 : 2100;
    setTimeout(function () {
      if (boot) boot.classList.add('is-done');
      openWindow('terminal');
      bootTerminal();
    }, delay);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-action="skip-boot"]')) {
      var boot = document.getElementById('boot');
      if (boot) boot.classList.add('is-done');
      openWindow('terminal');
      bootTerminal();
    }
  });

  runBoot();
})();
