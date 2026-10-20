/*
 * Shared media-asset helpers, used by the preview panels and the bulk-add widgets below.
 *
 * Decap resolves an asset's URL asynchronously; a path we just picked (especially through
 * our own bulk-add flow, which bypasses Decap's normal single-select insertion) can render
 * blank on the first pass — `getAsset` may return an asset with no `fileObj` yet, or throw
 * outright, rather than just returning its usual tiny loading placeholder. `assetUrl` treats
 * all of those as "still loading" (not just the placeholder case), and `pollUntilReady`
 * reschedules a re-render a few times until the real thumbnail shows up.
 */
(function () {
  window.__ja = window.__ja || {};

  window.__ja.assetUrl = function (getAsset, path, field) {
    try {
      var asset = getAsset(path, field);
      var url = asset ? String(asset) : '';
      // The not-yet-loaded placeholder is a tiny empty SVG; no URL at all also counts as pending.
      var pending = !url || (asset.fileObj && asset.fileObj.size < 200);
      return { url: url, pending: !!pending };
    } catch (e) {
      return { url: '', pending: true };
    }
  };

  // `component` is any React instance with `forceUpdate` (a class from createClass). Re-renders
  // it roughly every 500ms, up to 60 times, for as long as `pending` keeps coming back true.
  window.__ja.pollUntilReady = function (component, pending) {
    clearTimeout(component.__jaRetry);
    component.__jaAttempts = pending ? (component.__jaAttempts || 0) + 1 : 0;
    if (pending && component.__jaAttempts < 60) {
      component.__jaRetry = setTimeout(function () {
        component.forceUpdate();
      }, 500);
    }
  };

  window.__ja.stopPolling = function (component) {
    clearTimeout(component.__jaRetry);
  };
})();

/* Live preview for galleries: shows the project the way it appears on the work page. */
(function () {
  var h = window.h;
  var CMS = window.CMS;
  var createClass = window.createClass;
  if (!CMS || !h || !createClass) return;

  CMS.registerPreviewStyle(new URL('preview.css', window.location.href).href);

  var GalleryPreview = createClass({
    componentWillUnmount: function () {
      window.__ja.stopPolling(this);
    },
    render: function () {
      var props = this.props;
      var entry = props.entry;
      var data = entry.get('data');
      var title = data.get('title') || '';
      var brand = data.get('brand') || title;
      var season = data.get('season') || '';
      var layout = data.get('layout') || 'image-right';
      var focal = data.get('focal') || '50% 50%';
      var cover = data.get('coverImage');
      var order = Number(data.get('order') || 0);

      var resolved = cover ? window.__ja.assetUrl(props.getAsset, cover) : { url: '', pending: false };
      var number = String(order).padStart(2, '0');

      var self = this;
      setTimeout(function () {
        window.__ja.pollUntilReady(self, resolved.pending);
      }, 0);

      var text = h(
        'div',
        { className: 'text' },
        h('p', null, number),
        h('p', { className: 'title' }, brand, season ? h('br') : null, season)
      );
      var image = h(
        'div',
        { className: 'image' },
        resolved.url
          ? h('img', { src: resolved.url, alt: title, style: { objectPosition: focal } })
          : h('div', { className: 'empty' }, 'No cover image yet')
      );

      return h(
        'div',
        { className: 'preview' },
        h('p', { className: 'label' }, 'Work page'),
        h('section', { className: 'project project--' + layout }, text, image),
        null
      );
    },
  });

  CMS.registerPreviewTemplate('galleries', GalleryPreview);
})();

/* Live preview for the home page hero: the two photos behind the title. */
(function () {
  var h = window.h;
  var CMS = window.CMS;
  var createClass = window.createClass;
  if (!CMS || !h || !createClass) return;

  var HeroPreview = createClass({
    componentWillUnmount: function () {
      window.__ja.stopPolling(this);
    },
    render: function () {
      var props = this.props;
      var entry = props.entry;
      var data = entry.get('data');
      var images = data.get('images');
      var list = images && typeof images.toJS === 'function' ? images.toJS() : [];
      var rotate = !!data.get('rotate');
      var anyPending = false;

      function slot(item, className) {
        var resolved = item && item.image ? window.__ja.assetUrl(props.getAsset, item.image) : { url: '', pending: false };
        if (resolved.pending) anyPending = true;
        return h(
          'div',
          { className: 'hero-slot ' + className },
          resolved.url
            ? h('img', { src: resolved.url, alt: item.alt || '', style: { objectPosition: item.focal || '50% 50%' } })
            : h('div', { className: 'empty' }, 'No image yet')
        );
      }

      var right = slot(list[0], 'hero-slot--right');
      var left = slot(list[1], 'hero-slot--left');

      var self = this;
      setTimeout(function () {
        window.__ja.pollUntilReady(self, anyPending);
      }, 0);

      return h(
        'div',
        { className: 'preview' },
        h('p', { className: 'label' }, 'Home page hero' + (rotate && list.length > 2 ? ' (first pair shown, rotates through more)' : '')),
        h('div', { className: 'hero-preview' }, right, left)
      );
    },
  });

  CMS.registerPreviewTemplate('hero', HeroPreview);
})();

/* Live preview for the About page: the portrait beside the bio. */
(function () {
  var h = window.h;
  var CMS = window.CMS;
  var createClass = window.createClass;
  if (!CMS || !h || !createClass) return;

  var AboutPreview = createClass({
    componentWillUnmount: function () {
      window.__ja.stopPolling(this);
    },
    render: function () {
      var props = this.props;
      var data = props.entry.get('data');
      var image = data.get('image');
      var resolved = image ? window.__ja.assetUrl(props.getAsset, image) : { url: '', pending: false };

      var self = this;
      setTimeout(function () {
        window.__ja.pollUntilReady(self, resolved.pending);
      }, 0);

      return h(
        'div',
        { className: 'preview' },
        h('p', { className: 'label' }, 'About page'),
        h(
          'div',
          { className: 'about-preview' },
          h(
            'div',
            { className: 'about-preview__image' },
            resolved.url
              ? h('img', { src: resolved.url, alt: data.get('alt') || '', style: { objectPosition: data.get('focal') || '50% 50%' } })
              : h('div', { className: 'empty' }, 'No image yet')
          ),
          h('div', { className: 'about-preview__bio' }, props.widgetFor('body'))
        )
      );
    },
  });

  CMS.registerPreviewTemplate('about', AboutPreview);
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
 * Bulk-add-from-library widgets: every "add images" field in this CMS should let you tick
 * several photos in the media library and add them all at once, instead of one at a time.
 *
 * "photo-list" — a gallery's extra photos, stored as a flat array of paths.
 * "image-list" — the home page hero's images, stored as an array of {image, focal, alt}
 *                 objects (each picked image gets its own crop and alt text afterwards).
 *
 * Both wrap Decap's built-in image control (so the normal library, upload and search all
 * work) and, while the library is open from either field, let you tick several cards in the
 * modal and add them all at once via the shared overlay below.
 * Paths are stored like ~/assets/uploads/photo.jpg (the public_folder in config.yml).
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
      window.__ja.stopPolling(this);
      if (this.props.onRemoveMediaControl) this.props.onRemoveMediaControl(this.controlID());
    },
    paths: function () {
      // Defensively drop anything that isn't a real path: guards against a stray null a
      // stale reorder/remove click could otherwise leave behind (see `move` below).
      return toPaths(this.props.value).filter(function (p) {
        return typeof p === 'string' && p;
      });
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
      if (index < 0 || index >= list.length) return;
      list.splice(index, 1);
      this.set(list);
    },
    move: function (index, by) {
      var list = this.paths();
      // `index` itself must be validated too: a click can arrive after the array it was
      // rendered against has already changed (another click, or an in-flight media pick),
      // and splicing an out-of-range index silently yields `undefined` — which then gets
      // written back into the list and serializes to a stray `null` in the saved file.
      if (index < 0 || index >= list.length) return;
      var target = index + by;
      if (target < 0 || target >= list.length) return;
      var item = list.splice(index, 1)[0];
      list.splice(target, 0, item);
      this.set(list);
    },
    open: function () {
      var self = this;
      window.__jaBulkAdd = {
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
        var resolved = window.__ja.assetUrl(self.props.getAsset, path, self.props.field);
        if (resolved.pending) pending = true;
        return resolved.url;
      }

      var thumbs = paths.map(thumb);

      setTimeout(function () {
        window.__ja.pollUntilReady(self, pending);
      }, 0);

      return h(
        'div',
        { className: this.props.classNameWrapper, id: this.props.forID },
        paths.length
          ? h(
              'div',
              { className: 'ja-photos' },
              paths.map(function (path, i) {
                return h(
                  'div',
                  { className: 'ja-photo', key: path },
                  h('img', { src: thumbs[i], alt: '' }),
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

  var ImageList = createClass({
    controlID: function () {
      return 'ja-imagelist-' + (this.props.forID || 'images');
    },
    componentDidUpdate: function () {
      // A single image picked with Decap's own "Choose selected" button arrives here
      var id = this.controlID();
      var picked = this.props.mediaPaths && this.props.mediaPaths.get(id);
      if (picked) {
        this.props.onRemoveInsertedMedia(id);
        this.add(toPaths(picked));
      }
    },
    componentWillUnmount: function () {
      window.__ja.stopPolling(this);
      if (this.props.onRemoveMediaControl) this.props.onRemoveMediaControl(this.controlID());
    },
    items: function () {
      var value = this.props.value;
      if (!value) return [];
      var arr = typeof value.toJS === 'function' ? value.toJS() : value;
      if (!Array.isArray(arr)) return [];
      // Defensively drop anything that isn't a real {image, ...} entry: guards against a
      // stray null a stale reorder/remove click could otherwise leave behind (see `move`).
      return arr.filter(function (item) {
        return item && typeof item === 'object' && typeof item.image === 'string' && item.image;
      });
    },
    set: function (list) {
      this.props.onChange(list);
    },
    add: function (paths) {
      var current = this.items();
      var existing = current.map(function (item) {
        return item.image;
      });
      var fresh = paths.filter(function (p) {
        return p && existing.indexOf(p) === -1;
      });
      if (!fresh.length) return;
      var added = fresh.map(function (p) {
        return { image: p, focal: '50% 50%', alt: '' };
      });
      this.set(current.concat(added));
    },
    remove: function (index) {
      var list = this.items();
      if (index < 0 || index >= list.length) return;
      list.splice(index, 1);
      this.set(list);
    },
    move: function (index, by) {
      var list = this.items();
      // `index` itself must be validated too: a click can arrive after the array it was
      // rendered against has already changed (another click, or an in-flight media pick),
      // and splicing an out-of-range index silently yields `undefined` — which then gets
      // written back into the list and serializes to a stray `null` in the saved file.
      if (index < 0 || index >= list.length) return;
      var target = index + by;
      if (target < 0 || target >= list.length) return;
      var item = list.splice(index, 1)[0];
      list.splice(target, 0, item);
      this.set(list);
    },
    update: function (index, key, value) {
      var list = this.items();
      if (index < 0 || index >= list.length) return;
      var item = {};
      for (var k in list[index]) item[k] = list[index][k];
      item[key] = value;
      list[index] = item;
      this.set(list);
    },
    open: function () {
      var self = this;
      window.__jaBulkAdd = {
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
      var items = this.items();
      var pending = false;

      function thumb(path) {
        var resolved = window.__ja.assetUrl(self.props.getAsset, path, self.props.field);
        if (resolved.pending) pending = true;
        return resolved.url;
      }

      var thumbs = items.map(function (item) {
        return thumb(item.image);
      });

      setTimeout(function () {
        window.__ja.pollUntilReady(self, pending);
      }, 0);

      return h(
        'div',
        { className: this.props.classNameWrapper, id: this.props.forID },
        items.length
          ? h(
              'div',
              { className: 'ja-imagelist' },
              items.map(function (item, i) {
                return h(
                  // Key on the path alone (not the index): stable across reorders, so a move
                  // doesn't tear down and rebuild the crop/alt inputs (and lose focus/typing).
                  'div',
                  { className: 'ja-imagelist__item', key: item.image },
                  h('img', { src: thumbs[i], alt: '' }),
                  h(
                    'div',
                    { className: 'ja-imagelist__fields' },
                    h('input', {
                      type: 'text',
                      placeholder: 'Crop, e.g. 50% 50%',
                      value: item.focal || '',
                      onChange: function (e) {
                        self.update(i, 'focal', e.target.value);
                      },
                    }),
                    h('input', {
                      type: 'text',
                      placeholder: 'Alt text',
                      value: item.alt || '',
                      onChange: function (e) {
                        self.update(i, 'alt', e.target.value);
                      },
                    })
                  ),
                  h(
                    'div',
                    { className: 'ja-imagelist__actions' },
                    h('button', { type: 'button', title: 'Move earlier', onClick: function () { self.move(i, -1); } }, '‹'),
                    h('button', { type: 'button', title: 'Move later', onClick: function () { self.move(i, 1); } }, '›'),
                    h('button', { type: 'button', title: 'Remove', onClick: function () { self.remove(i); } }, '×')
                  )
                );
              })
            )
          : h('p', { className: 'ja-imagelist__empty' }, 'No images yet.'),
        h(
          'button',
          { type: 'button', className: 'ja-imagelist__add', onClick: this.open },
          items.length ? 'Add more images' : 'Add images'
        )
      );
    },
  });

  CMS.registerWidget('image-list', ImageList, function () {
    return null;
  });

  /* ---- Multi-select inside the library modal (shared by every bulk-add field above) ---- */
  var selected = Object.create(null); // name -> true, for O(1) toggling instead of Array#indexOf
  var selectedCount = 0;
  var bar = null;

  // The media library modal. In Decap 3.x its emotion class label is "StyledModal" (the only
  // component with that label); there is no "MediaLibraryModal" class, but it's kept as a
  // fallback in case a future Decap version adds one. Cached while it stays in the DOM, so the
  // hot paths (clicks, observers) don't substring-match every class in the app each time.
  var cachedModal = null;
  function modal() {
    if (cachedModal && cachedModal.isConnected) return cachedModal;
    cachedModal = document.querySelector('[class*="StyledModal"], [class*="MediaLibraryModal"]');
    return cachedModal;
  }

  // The clickable card for a library thumbnail: the nearest ancestor holding the filename text.
  function cardFor(target) {
    var m = modal();
    if (!m || !m.contains(target)) return null;
    var el = target;
    while (el && el !== m) {
      if (el.querySelector && el.querySelector('p[class*="CardText"]')) return el;
      el = el.parentElement;
    }
    return null;
  }

  function nameOf(card) {
    var text = card.querySelector('p[class*="CardText"]');
    return text ? text.textContent.trim() : '';
  }

  function render() {
    if (!bar) return;
    var button = bar.querySelector('[data-ja-add]');
    var label = selectedCount ? 'Add ' + selectedCount + ' selected' : 'Tick images to add';
    // Only touch the DOM when something changed: this runs from a MutationObserver
    if (button.textContent !== label) button.textContent = label;
    button.disabled = !selectedCount;
  }

  var markScheduled = false;
  function mark() {
    if (markScheduled) return;
    markScheduled = true;
    // Re-syncs ticks after Decap re-renders (the grid is virtualised and reuses card nodes for
    // other files as you scroll). Bursts of mutations are coalesced into one scan per frame.
    requestAnimationFrame(function () {
      markScheduled = false;
      var m = modal();
      if (!m) return;
      m.querySelectorAll('p[class*="CardText"]').forEach(function (p) {
        var card = p.parentElement;
        var on = !!selected[p.textContent.trim()];
        if (on !== card.hasAttribute('data-ja-selected')) card.toggleAttribute('data-ja-selected', on);
      });
      render();
    });
  }

  function ensureBar() {
    if (bar && document.body.contains(bar)) return;
    bar = document.createElement('div');
    bar.className = 'ja-multibar';
    bar.innerHTML =
      '<span>Click images to tick them</span>' +
      '<button type="button" data-ja-all>Select all</button>' +
      '<button type="button" data-ja-add disabled>Tick images to add</button>';
    document.body.appendChild(bar);
    // Scopes the admin.css rules that hide Decap's (unusable here) "Choose selected" /
    // "Delete selected" buttons and keep cards clickable while the grid is scrolling.
    document.body.classList.add('ja-bulk');
    bar.querySelector('[data-ja-all]').addEventListener('click', function () {
      var m = modal();
      if (!m) return;
      var names = Array.prototype.map.call(m.querySelectorAll('p[class*="CardText"]'), function (p) {
        return p.textContent.trim();
      });
      var allSelected = names.length > 0 && names.every(function (n) { return selected[n]; });
      selected = Object.create(null);
      selectedCount = 0;
      if (!allSelected) {
        names.forEach(function (n) {
          selected[n] = true;
          selectedCount++;
        });
      }
      mark();
    });
    bar.querySelector('[data-ja-add]').addEventListener('click', function () {
      if (!window.__jaBulkAdd || !selectedCount) return;
      window.__jaBulkAdd.add(
        Object.keys(selected).map(function (name) {
          return PUBLIC_PREFIX + name;
        })
      );
      var close = modal() && modal().querySelector('[class*="CloseButton"]');
      selected = Object.create(null);
      selectedCount = 0;
      if (close) close.click();
    });
  }

  document.addEventListener(
    'click',
    function (event) {
      if (!window.__jaBulkAdd) return;
      var card = cardFor(event.target);
      if (!card) return;
      event.stopPropagation();
      event.preventDefault();
      var name = nameOf(card);
      if (!name) return;
      var on = !selected[name];
      if (on) {
        selected[name] = true;
        selectedCount++;
      } else {
        delete selected[name];
        selectedCount--;
      }
      // Update this card and the bar right away instead of waiting for the next frame's scan
      card.toggleAttribute('data-ja-selected', on);
      render();
    },
    true
  );

  // Watches only the open modal (not the whole app) to re-sync ticks. `characterData` catches
  // a reused card whose filename text changed without any node being added or removed.
  var modalObserver = new MutationObserver(mark);

  // Only reset once the modal has actually been open and then closed: DOM changes between
  // clicking "Add images" and the modal mounting must not wipe `__jaBulkAdd` early.
  var modalWasOpen = false;
  new MutationObserver(function () {
    var m = modal();
    if (m) {
      if (!modalWasOpen && window.__jaBulkAdd) {
        ensureBar();
        modalObserver.observe(m, { childList: true, subtree: true, characterData: true });
        mark();
      }
      modalWasOpen = true;
    } else if (modalWasOpen) {
      modalWasOpen = false;
      modalObserver.disconnect();
      window.__jaBulkAdd = null;
      selected = Object.create(null);
      selectedCount = 0;
      document.body.classList.remove('ja-bulk');
      if (bar) {
        bar.remove();
        bar = null;
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
