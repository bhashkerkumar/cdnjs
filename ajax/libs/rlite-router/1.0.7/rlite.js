// This library started as an experiment to see how small I could make
// a functional router. It has since been optimized (and thus grown).
// The redundancy and inelegance here is for the sake of either size
// or speed.
function Rlite() {
  var routes = {},
      decode = decodeURIComponent;

  function noop(s) { return s; }

  function sanitize(url) {
    url.indexOf('/?') >= 0 && (url = url.replace('/?', '?'));
    url[0] == '/' && (url = url.slice(1));
    url[url.length - 1] == '/' && (url = url.slice(0, -1));

    return url;
  }

  function processUrl(url) {
    var esc = url.indexOf('%') >= 0 ? decode : noop,
        pieces = url.split('/'),
        rules = routes,
        params = {};

    for (var i = 0; i < pieces.length && rules; ++i) {
      var piece = esc(pieces[i]);
      rules = rules[piece.toLowerCase()] || rules[':'];
      rules && rules[':'] && (params[rules[':']] = piece);
    }

    return rules && {
      cb: rules['@'],
      params: params
    };
  }

  function processQuery(url, ctx) {
    if (url) {
      var hash = url.indexOf('#'),
          esc = url.indexOf('%') >= 0 ? decode : noop,
          query = (hash < 0 ? url : url.slice(0, hash)).split('&');

      for (var i = 0; i < query.length; ++i) {
        var nameValue = query[i].split('=');

        ctx.params[nameValue[0]] = esc(nameValue[1]);
      }
    }

    return ctx;
  }

  function lookup(url) {
    var querySplit = sanitize(url).split('?');

    return processQuery(querySplit[1], processUrl(querySplit[0]) || {});
  }

  return {
    add: function(route, handler) {
      var pieces = route.toLowerCase().split('/'),
          rules = routes;

      for (var i = 0; i < pieces.length; ++i) {
        var piece = pieces[i],
            name = piece[0] == ':' ? ':' : piece;

        rules = rules[name] || (rules[name] = {});

        name == ':' && (rules[':'] = piece.slice(1));
      }

      rules['@'] = handler;
    },

    exists: function (url) {
      return !!lookup(url).cb;
    },

    run: function(url) {
      var result = lookup(url);

      result.cb && result.cb({
        url: url,
        params: result.params
      });

      return !!result.cb;
    }
  };
}

(function (root, factory) {
  var define = root.define;

  if (define && define.amd) {
    define([], factory);
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  }
}(this, function () { return Rlite; }));
