/* Live preview for galleries: shows the project the way it appears on the work page. */
(function () {
  var h = window.h;
  var CMS = window.CMS;
  if (!CMS || !h) return;

  CMS.registerPreviewStyle(new URL('preview.css', window.location.href).href);

  function toList(value) {
    if (!value) return [];
    if (typeof value.toArray === 'function') return value.toArray();
    return Array.isArray(value) ? value : [value];
  }

  var GalleryPreview = function (props) {
    var entry = props.entry;
    var data = entry.get('data');
    var title = data.get('title') || '';
    var brand = data.get('brand') || title;
    var season = data.get('season') || '';
    var layout = data.get('layout') || 'image-right';
    var focal = data.get('focal') || '50% 50%';
    var cover = data.get('coverImage');
    var photos = toList(data.get('photos'));
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
      photos.length
        ? h(
            'div',
            null,
            h('p', { className: 'label' }, 'Photos (' + photos.length + ')'),
            h(
              'div',
              { className: 'photos' },
              photos.map(function (path) {
                return h('img', { key: path, src: String(props.getAsset(path)), alt: '' });
              })
            )
          )
        : null
    );
  };

  CMS.registerPreviewTemplate('galleries', GalleryPreview);
})();
