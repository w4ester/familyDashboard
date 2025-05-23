#!/bin/bash

# Generate SSL certificate for local HTTPS server
echo "Generating self-signed SSL certificate for local server..."

# Create certificates directory
mkdir -p certs

# Generate private key
openssl genrsa -out certs/server.key 2048

# Generate certificate signing request
openssl req -new -key certs/server.key -out certs/server.csr -subj "/C=US/ST=State/L=City/O=Family Dashboard/CN=localhost"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in certs/server.csr -signkey certs/server.key -out certs/server.crt

# Create a combined certificate file for some applications
cat certs/server.crt certs/server.key > certs/server.pem

echo "SSL certificate generated successfully!"
echo "Files created:"
echo "  - certs/server.key (private key)"
echo "  - certs/server.crt (certificate)"
echo "  - certs/server.pem (combined)"
echo ""
echo "To use these certificates, update your server configuration."