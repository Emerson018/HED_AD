import secrets
import string


def generate_password(length: int = None) -> str:
    """
    Generate a random password satisfying Politica_Senha.
    Length is randomly chosen between 12-16 if not specified.
    Guarantees: ≥1 uppercase, ≥1 lowercase, ≥1 digit, ≥1 special char.
    """
    special_chars = "!@#$%^&*"

    if length is None:
        length = secrets.choice(range(12, 17))  # 12-16 inclusive

    # Guarantee at least one of each required character type
    password_chars = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice(special_chars),
    ]

    # Fill remaining characters from the full allowed set
    all_chars = string.ascii_letters + string.digits + special_chars
    remaining = length - len(password_chars)
    for _ in range(remaining):
        password_chars.append(secrets.choice(all_chars))

    # Shuffle to avoid predictable positions of guaranteed characters
    secrets.SystemRandom().shuffle(password_chars)

    return "".join(password_chars)
