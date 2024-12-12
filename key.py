import base64
import hashlib

def get_extension_id(public_key_base64):
    # Decode the base64 public key
    der = base64.b64decode(public_key_base64)
    
    # Calculate SHA256 hash
    hash_bytes = hashlib.sha256(der).digest()
    
    # Take first 16 bytes of the hash
    hash_bytes = hash_bytes[:16]
    
    # Convert to hex
    hex_str = ''.join('{:02x}'.format(b) for b in hash_bytes)
    
    # Convert to Chrome extension ID format (a-p)
    chars = 'abcdefghijklmnop'
    extension_id = ''.join(chars[int(c, 16)] for c in hex_str)
    
    return extension_id

public_key = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1paAHiizuw6KWRX9mFaRKMvN7y7NB3JerYx1LxIGAdRDR4CLwwA/pWpk+6k4fj35BWU8X4xYyAlbQ4cp40OfyvapxP3J6sXC1OcvVGyCEjPJlo3g0AbaoSoZAHXGhuVe5r7lEM2ODkJWY6CTs2GXnyK0JZXb4wJeLHctMa3yjX8KWGB/asqa0jCbGL6H/a3j9hVoiQozAO4mA4ICocAACfEdpHGlL29d1KnDQIwapy0b+iVxBB35mQg2iqg4aaVgnyA0Fy65IbhJJjlOyfUJlLMfQ1x4AtWe/zyGPkG5Y/zF+IU6VjIvYJba0CEaw7ttxSDt1GBU+m8ctDSULFuSRwIDAQAB"
print(get_extension_id(public_key))