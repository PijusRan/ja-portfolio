/* Live preview for galleries: shows the project the way it appears on the work page. */
(function () {
  var h = window.h;
  var CMS = window.CMS;
  if (!CMS || !h) return;

  CMS.registerPreviewStyle(new URL('preview.css', window.location.href).href);

  var GalleryPreview = function (props) {
    var entry = props.entry;
    var data = entry.get('data');
    var title = data.get('title') || '';
    var brand = data.get('brand') || title;
    var season = data.get('season') || '';
    var layout = data.get('layout') || 'image-right';
    var focal = data.get('focal') || '50% 50%';
    var cover = data.get('coverImage');
    var order = Number(data.get('order') || 0);

    var coverUrl = cover ? String(props.getAsset(cover)) : '';
    var number = String(order).padStart(2, '0');

    var text = h(
      'div',
      { className: 'text' },
      h('p', null, number),
      h('p', { className: 'title' }, brand, season ? h('br') : null, season)
    );
    var image = h(
      'div',
      { className: 'image' },
      coverUrl
        ? h('img', { src: coverUrl, alt: title, style: { objectPosition: focal } })
        : h('div', { className: 'empty' }, 'No cover image yet')
    );

    return h(
      'div',
      { className: 'preview' },
      h('p', { className: 'label' }, 'Work page'),
      h('section', { className: 'project project--' + layout }, text, image),
      null
    );
  };

  CMS.registerPreviewTemplate('galleries', GalleryPreview);
})();

/*
 * Multi-file upload for the media library.
 * Decap's Upload button only accepts one file, and it persists only the first file of any
 * selection. We allow multi-select on the picker and, when several files arrive at once,
 * feed them to Decap one at a time as separate single-file "change" events.
 */
(function () {
  var replaying = false;
  var STEP_MS = 900;

  function allowMultiple(root) {
    (root.querySelectorAll ? root.querySelectorAll('input[type="file"]') : []).forEach(function (input) {
      if (!input.multiple) input.multiple = true;
    });
  }

  new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches('input[type="file"]')) node.multiple = true;
        else allowMultiple(node);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener(
    'change',
    function (event) {
      var input = event.target;
      if (replaying || !input || input.type !== 'file' || !input.files || input.files.length < 2) return;

      // Stop Decap from seeing the multi-file event (it would keep only the first file)
      event.stopImmediatePropagation();
      event.preventDefault();

      var files = Array.prototype.slice.call(input.files);
      var index = 0;

      function next() {
        if (index >= files.length) {
          replaying = false;
          return;
        }
        var transfer = new DataTransfer();
        transfer.items.add(files[index++]);
        input.files = transfer.files;
        replaying = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        replaying = false;
        setTimeout(next, STEP_MS);
      }

      next();
    },
    true
  );
})();



/*
 * "photo-list" widget: a gallery's extra photos, picked from the shared media library.
 *
 * Decap's built-in picker selects one image at a time. This widget wraps the built-in image
 * control (so the normal library, upload and search all work) and, while the library is open
 * from this field, lets you tick several cards and add them all at once.
 * Values are stored as paths like ~/assets/uploads/photo.jpg (the public_folder in config.yml).
 */
(function () {
  var CMS = window.CMS;
  var h = window.h;
  var createClass = window.createClass;
  if (!CMS || !h || !createClass) return;

  var PUBLIC_PREFIX = '~/assets/uploads/'; // keep in sync with public_folder in config.yml

  function toPaths(value) {
    if (!value) return [];
    if (typeof value.toJS === 'function') return value.toJS();
    return Array.isArray(value) ? value : [value];
  }

  var PhotoList = createClass({
    controlID: function () {
      return 'ja-photos-' + (this.props.forID || 'photos');
    },
    componentDidUpdate: function () {
      // A single photo picked with Decap's own "Choose selected" button arrives here
      var id = this.controlID();
      var picked = this.props.mediaPaths && this.props.mediaPaths.get(id);
      if (picked) {
        this.props.onRemoveInsertedMedia(id);
        this.add(picked);
      }
    },
    componentWillUnmount: function () {
      clearTimeout(this.retry);
      if (this.props.onRemoveMediaControl) this.props.onRemoveMediaControl(this.controlID());
    },
    // Decap loads existing files asynchronously and first returns an empty placeholder;
    // re-render until every thumbnail has real data.
    waitForAssets: function (pending) {
      var self = this;
      clearTimeout(this.retry);
      this.attempts = pending ? (this.attempts || 0) + 1 : 0;
      if (pending && this.attempts < 60) {
        this.retry = setTimeout(function () {
          self.forceUpdate();
        }, 500);
      }
    },
    paths: function () {
      return toPaths(this.props.value);
    },
    set: function (list) {
      this.props.onChange(list);
    },
    add: function (added) {
      var current = this.paths();
      var fresh = toPaths(added).filter(function (p) {
        return p && current.indexOf(p) === -1;
      });
      if (fresh.length) this.set(current.concat(fresh));
    },
    remove: function (index) {
      var list = this.paths();
      list.splice(index, 1);
      this.set(list);
    },
    move: function (index, by) {
      var list = this.paths();
      var target = index + by;
      if (target < 0 || target >= list.length) return;
      var item = list.splice(index, 1)[0];
      list.splice(target, 0, item);
      this.set(list);
    },
    open: function () {
      var self = this;
      window.__jaPhotos = {
        add: function (list) {
          self.add(list);
        },
      };
      this.props.onOpenMediaLibrary({
        controlID: this.controlID(),
        forImage: true,
        privateUpload: false,
        value: '',
        allowMultiple: false,
        field: this.props.field,
      });
    },
    render: function () {
      var self = this;
      var paths = this.paths();
      var pending = false;

      function thumb(path) {
        try {
          var asset = self.props.getAsset(path, self.props.field);
          // The placeholder is a tiny empty SVG; real photos are far bigger
          if (asset && asset.fileObj && asset.fileObj.size < 200) pending = true;
          return String(asset);
        } catch (e) {
          return '';
        }
      }

      setTimeout(function () {
        self.waitForAssets(pending);
      }, 0);

      return h(
        'div',
        { className: this.props.classNameWrapper, id: this.props.forID },
        paths.length
          ? h(
              'div',
              { className: 'ja-photos' },
              paths.map(function (path, i) {
                var url = thumb(path);
                return h(
                  'div',
                  { className: 'ja-photo', key: path },
                  h('img', { src: url, alt: '' }),
                  h(
                    'div',
                    { className: 'ja-photo__actions' },
                    h('button', { type: 'button', title: 'Move earlier', onClick: function () { self.move(i, -1); } }, '‹'),
                    h('button', { type: 'button', title: 'Move later', onClick: function () { self.move(i, 1); } }, '›'),
                    h('button', { type: 'button', title: 'Remove', onClick: function () { self.remove(i); } }, '×')
                  )
                );
              })
            )
          : h('p', { className: 'ja-photos__empty' }, 'No photos yet.'),
        h(
          'button',
          { type: 'button', className: 'ja-photos__add', onClick: this.open },
          paths.length ? 'Add more photos' : 'Add photos'
        )
      );
    },
  });

  CMS.registerWidget('photo-list', PhotoList, function () {
    return null;
  });

  /* ---- Multi-select inside the library modal (only while opened from a photo-list field) ---- */
  var selected = [];
  var bar = null;

  function modal() {
    return document.querySelector('[class*="StyledModal"]');
  }

  function cardFor(target) {
    var m = modal();
    if (!m || !m.contains(target)) return null;
    var el = target;
    while (el && el !== m) {
      if (el.querySelector && el.querySelector(':scope > p[class*="CardText"]')) return el;
      el = el.parentElement;
    }
    return null;
  }

  function nameOf(card) {
    return card.querySelector(':scope > p[class*="CardText"]').textContent.trim();
  }

  function render() {
    if (!bar) return;
    var count = selected.length;
    var button = bar.querySelector('[data-ja-add]');
    var label = count ? 'Add ' + count + ' selected' : 'Tick photos to add';
    // Only touch the DOM when something changed: this runs from a MutationObserver
    if (button.textContent !== label) button.textContent = label;
    button.disabled = !count;
  }

  function mark() {
    var m = modal();
    if (!m) return;
    m.querySelectorAll('p[class*="CardText"]').forEach(function (p) {
      var card = p.parentElement;
      var on = selected.indexOf(p.textContent.trim()) !== -1;
      if (on !== card.hasAttribute('data-ja-selected')) card.toggleAttribute('data-ja-selected', on);
    });
    render();
  }

  function ensureBar() {
    if (bar && document.body.contains(bar)) return;
    bar = document.createElement('div');
    bar.className = 'ja-multibar';
    bar.innerHTML =
      '<span>Click photos to tick them</span>' +
      '<button type="button" data-ja-all>Select all</button>' +
      '<button type="button" data-ja-add disabled>Tick photos to add</button>';
    document.body.appendChild(bar);
    bar.querySelector('[data-ja-all]').addEventListener('click', function () {
      var m = modal();
      if (!m) return;
      var names = Array.prototype.map.call(m.querySelectorAll('p[class*="CardText"]'), function (p) {
        return p.textContent.trim();
      });
      selected = selected.length === names.length ? [] : names;
      mark();
    });
    bar.querySelector('[data-ja-add]').addEventListener('click', function () {
      if (!window.__jaPhotos || !selected.length) return;
      window.__jaPhotos.add(
        selected.map(function (name) {
          return PUBLIC_PREFIX + name;
        })
      );
      var close = modal() && modal().querySelector('[class*="CloseButton"]');
      selected = [];
      if (close) close.click();
    });
  }

  document.addEventListener(
    'click',
    function (event) {
      if (!window.__jaPhotos) return;
      var card = cardFor(event.target);
      if (!card) return;
      event.stopPropagation();
      event.preventDefault();
      var name = nameOf(card);
      var i = selected.indexOf(name);
      if (i === -1) selected.push(name);
      else selected.splice(i, 1);
      mark();
    },
    true
  );

  new MutationObserver(function () {
    var m = modal();
    if (m && window.__jaPhotos) {
      ensureBar();
      mark();
    } else if (!m) {
      window.__jaPhotos = null;
      selected = [];
      if (bar) {
        bar.remove();
        bar = null;
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
