FROM nginx:alpine

RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/key.pem \
        -out /etc/nginx/ssl/cert.pem \
        -subj "/C=AM/ST=Yerevan/L=Yerevan/O=42Yerevan/OU=ft_transcendence/CN=localhost"

EXPOSE 443
