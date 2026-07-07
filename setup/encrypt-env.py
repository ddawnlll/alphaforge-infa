#!/usr/bin/env python3
"""Encrypt .env → .env.enc for safe git storage."""
import os, sys, base64, getpass
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

SALT = b'alphaforge-salt'

env_src = sys.argv[1] if len(sys.argv) > 1 else '.env'
env_out = '.env.enc'

if not os.path.exists(env_src):
    print(f"❌ {env_src} not found")
    sys.exit(1)

password = getpass.getpass("Encryption password: ").encode()
confirm  = getpass.getpass("Confirm password: ").encode()
if password != confirm:
    print("❌ Passwords don't match!")
    sys.exit(1)

kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=SALT, iterations=100000)
key = base64.urlsafe_b64encode(kdf.derive(password))
fernet = Fernet(key)

with open(env_src, 'rb') as f:
    encrypted = fernet.encrypt(f.read())

with open(env_out, 'wb') as f:
    f.write(encrypted)

os.chmod(env_out, 0o600)
print(f"🔐 Encrypted: {env_src} → {env_out} ({len(encrypted)} bytes)")
