#!/usr/bin/env python3
"""Decrypt .env.enc → .env."""
import os, sys, base64, getpass
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

SALT = b'alphaforge-salt'

crypt_file = sys.argv[1] if len(sys.argv) > 1 else '.env.enc'
env_out = '.env'

if not os.path.exists(crypt_file):
    print(f"❌ {crypt_file} not found")
    sys.exit(1)

password = getpass.getpass("Encryption password: ").encode()

kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=SALT, iterations=100000)
key = base64.urlsafe_b64encode(kdf.derive(password))
fernet = Fernet(key)

with open(crypt_file, 'rb') as f:
    try:
        decrypted = fernet.decrypt(f.read())
    except Exception:
        print("❌ Wrong password or corrupted file!")
        sys.exit(1)

with open(env_out, 'wb') as f:
    f.write(decrypted)

os.chmod(env_out, 0o600)
print(f"🔓 Decrypted: {crypt_file} → {env_out} ({len(decrypted)} bytes)")
