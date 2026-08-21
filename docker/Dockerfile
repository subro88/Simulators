FROM nginx:alpine

# Custom static-server config: listens on 8080, dev-friendly (no HTML caching).
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Fallback: bake the site in. At runtime a bind mount overrides this for live edits.
COPY nhitvisuallab/ /usr/share/nginx/html/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:8080/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
