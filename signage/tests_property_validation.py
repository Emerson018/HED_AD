"""
Property-based tests for input validation in RegisterView.

Feature: admin-user-management, Property 3: Input validation classifies valid/invalid inputs
Validates: Requirements 3.3, 3.4, 3.5

This module tests the validation logic used by the RegisterView endpoint.
It extracts the same validation rules applied in the view and verifies them
as pure functions using Hypothesis, ensuring correctness across all inputs.
"""
import re
import string

from hypothesis import given, settings as h_settings, assume, HealthCheck
from hypothesis import strategies as st

from django.test import SimpleTestCase


# --- Validation functions (mirror the logic in RegisterView.post) ---

USERNAME_PATTERN = re.compile(r'^[a-z0-9.,]+$')
PASSWORD_SPECIAL_PATTERN = re.compile(r'[!@#$%^&*(),.?":{}|<>]')


def validate_username(username: str) -> str | None:
    """
    Validate username per RegisterView rules.
    Returns error message if invalid, None if valid.
    """
    username = username.strip().lower()
    if not username:
        return 'O nome de usuário é obrigatório.'
    if len(username) < 3:
        return 'O usuário deve ter pelo menos 3 caracteres.'
    if not USERNAME_PATTERN.match(username):
        return 'Apenas letras minúsculas, números, ponto e vírgula são permitidos.'
    return None


def validate_password(password: str) -> str | None:
    """
    Validate password per RegisterView rules.
    Returns error message if invalid, None if valid.
    """
    if not password:
        return 'A senha é obrigatória.'
    if len(password) < 6:
        return 'A senha deve ter no mínimo 6 caracteres.'
    if not re.search(r'[A-Z]', password):
        return 'A senha deve conter pelo menos uma letra maiúscula.'
    if not re.search(r'[a-z]', password):
        return 'A senha deve conter pelo menos uma letra minúscula.'
    if not re.search(r'[0-9]', password):
        return 'A senha deve conter pelo menos um número.'
    if not PASSWORD_SPECIAL_PATTERN.search(password):
        return 'A senha deve conter pelo menos um caractere especial.'
    return None


def validate_cnpj(cnpj: str) -> str | None:
    """
    Validate CNPJ per RegisterView rules (format only, not uniqueness).
    Returns error message if invalid, None if valid.
    Empty CNPJ is always valid (optional field).
    """
    cnpj = cnpj.strip()
    if not cnpj:
        return None
    clean_cnpj = re.sub(r'\D', '', cnpj)
    if len(clean_cnpj) != 14:
        return 'O CNPJ deve conter exatamente 14 dígitos numéricos.'
    return None


def validate_telefone(telefone: str) -> str | None:
    """
    Validate telefone per RegisterView rules (format only).
    Returns error message if invalid, None if valid.
    Empty telefone is always valid (optional field).
    """
    telefone = telefone.strip()
    if not telefone:
        return None
    clean_telefone = re.sub(r'\D', '', telefone)
    if len(clean_telefone) not in (10, 11):
        return 'O telefone deve conter 10 ou 11 dígitos numéricos.'
    return None


# --- Strategies ---

USERNAME_VALID_CHARS = string.ascii_lowercase + string.digits + '.,'
PASSWORD_SPECIAL_CHARS = '!@#$%^&*(),.?":{}|<>'


def valid_username_strategy():
    """Generate valid usernames: 3+ chars from [a-z0-9.,]"""
    return st.text(alphabet=USERNAME_VALID_CHARS, min_size=3, max_size=20)


def invalid_username_too_short_strategy():
    """Generate usernames that are too short (1-2 chars from valid set)."""
    return st.text(alphabet=USERNAME_VALID_CHARS, min_size=1, max_size=2)


def invalid_username_bad_chars_strategy():
    """Generate usernames >=3 chars with at least one always-invalid character."""
    always_invalid = '!@#$%^&*()_-+=[]{}|;\' <>?/\\'
    invalid_char = st.sampled_from(list(always_invalid))
    valid_part = st.text(alphabet=USERNAME_VALID_CHARS, min_size=2, max_size=8)
    return st.tuples(valid_part, invalid_char).map(lambda t: t[0] + t[1])


def valid_password_strategy():
    """Generate valid passwords: >=6 chars with uppercase, lowercase, digit, special."""
    upper = st.sampled_from(list(string.ascii_uppercase))
    lower = st.sampled_from(list(string.ascii_lowercase))
    digit = st.sampled_from(list(string.digits))
    special = st.sampled_from(list(PASSWORD_SPECIAL_CHARS))
    extra = st.text(
        alphabet=string.ascii_letters + string.digits + PASSWORD_SPECIAL_CHARS,
        min_size=2, max_size=8,
    )
    return st.tuples(upper, lower, digit, special, extra).map(
        lambda t: t[0] + t[1] + t[2] + t[3] + t[4]
    )


def invalid_password_too_short_strategy():
    """Generate passwords <6 chars."""
    return st.text(
        alphabet=string.ascii_letters + string.digits + PASSWORD_SPECIAL_CHARS,
        min_size=1, max_size=5,
    )


def invalid_password_no_uppercase_strategy():
    """Generate passwords >=6 chars missing uppercase, but having lowercase+digit+special."""
    lower = st.sampled_from(list(string.ascii_lowercase))
    digit = st.sampled_from(list(string.digits))
    special = st.sampled_from(list(PASSWORD_SPECIAL_CHARS))
    filler = st.text(
        alphabet=string.ascii_lowercase + string.digits + PASSWORD_SPECIAL_CHARS,
        min_size=3, max_size=8,
    )
    return st.tuples(lower, digit, special, filler).map(
        lambda t: t[0] + t[1] + t[2] + t[3]
    )


def invalid_password_no_lowercase_strategy():
    """Generate passwords >=6 chars missing lowercase, but having uppercase+digit+special."""
    upper = st.sampled_from(list(string.ascii_uppercase))
    digit = st.sampled_from(list(string.digits))
    special = st.sampled_from(list(PASSWORD_SPECIAL_CHARS))
    filler = st.text(
        alphabet=string.ascii_uppercase + string.digits + PASSWORD_SPECIAL_CHARS,
        min_size=3, max_size=8,
    )
    return st.tuples(upper, digit, special, filler).map(
        lambda t: t[0] + t[1] + t[2] + t[3]
    )


def invalid_password_no_digit_strategy():
    """Generate passwords >=6 chars missing digit, but having upper+lower+special."""
    upper = st.sampled_from(list(string.ascii_uppercase))
    lower = st.sampled_from(list(string.ascii_lowercase))
    special = st.sampled_from(list(PASSWORD_SPECIAL_CHARS))
    filler = st.text(
        alphabet=string.ascii_letters + PASSWORD_SPECIAL_CHARS,
        min_size=3, max_size=8,
    )
    return st.tuples(upper, lower, special, filler).map(
        lambda t: t[0] + t[1] + t[2] + t[3]
    ).filter(lambda s: not re.search(r'[0-9]', s))


def invalid_password_no_special_strategy():
    """Generate passwords >=6 chars missing special, but having upper+lower+digit."""
    upper = st.sampled_from(list(string.ascii_uppercase))
    lower = st.sampled_from(list(string.ascii_lowercase))
    digit = st.sampled_from(list(string.digits))
    filler = st.text(
        alphabet=string.ascii_letters + string.digits,
        min_size=3, max_size=8,
    )
    return st.tuples(upper, lower, digit, filler).map(
        lambda t: t[0] + t[1] + t[2] + t[3]
    )


def valid_cnpj_strategy():
    """Generate valid CNPJ: exactly 14 digits."""
    return st.text(alphabet=string.digits, min_size=14, max_size=14)


def invalid_cnpj_strategy():
    """Generate invalid CNPJ: not exactly 14 digits (but non-empty)."""
    return st.one_of(
        st.text(alphabet=string.digits, min_size=1, max_size=13),
        st.text(alphabet=string.digits, min_size=15, max_size=20),
    )


def valid_telefone_strategy():
    """Generate valid telefone: 10 or 11 digits."""
    return st.one_of(
        st.text(alphabet=string.digits, min_size=10, max_size=10),
        st.text(alphabet=string.digits, min_size=11, max_size=11),
    )


def invalid_telefone_strategy():
    """Generate invalid telefone: not 10 or 11 digits (but non-empty)."""
    return st.one_of(
        st.text(alphabet=string.digits, min_size=1, max_size=9),
        st.text(alphabet=string.digits, min_size=12, max_size=16),
    )


# Common hypothesis settings for all property tests
_PROP_SETTINGS = dict(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.too_slow, HealthCheck.function_scoped_fixture],
)


class PropertyTestInputValidation(SimpleTestCase):
    """
    Property 3: Input validation correctly classifies valid and invalid inputs.

    **Validates: Requirements 3.3, 3.4, 3.5**

    For any string input, the validation functions SHALL accept the input if and
    only if it satisfies all applicable rules:
    - username accepted iff it matches ^[a-z0-9.,]{3,}$
    - email accepted iff it contains a valid email format
    - CNPJ accepted iff it has exactly 14 numeric digits (when non-empty)
    - telefone accepted iff it has 10 or 11 numeric digits (when non-empty)
    - password accepted iff it has >=6 chars AND contains at least one uppercase,
      one lowercase, one digit, and one special character

    Tests validate the pure validation logic extracted from RegisterView,
    ensuring the same rules are applied consistently.
    """

    # ===== USERNAME TESTS =====

    @h_settings(**_PROP_SETTINGS)
    @given(username=valid_username_strategy())
    def test_valid_username_accepted(self, username):
        """
        **Validates: Requirements 3.3**

        Valid usernames (matching ^[a-z0-9.,]{3,}$) should be accepted.
        """
        error = validate_username(username)
        self.assertIsNone(error,
                          f"Valid username '{username}' rejected: {error}")

    @h_settings(**_PROP_SETTINGS)
    @given(username=invalid_username_too_short_strategy())
    def test_invalid_username_too_short_rejected(self, username):
        """
        **Validates: Requirements 3.3**

        Usernames shorter than 3 characters should be rejected.
        """
        error = validate_username(username)
        self.assertIsNotNone(error,
                             f"Short username '{username}' was not rejected")

    @h_settings(**_PROP_SETTINGS)
    @given(username=invalid_username_bad_chars_strategy())
    def test_invalid_username_bad_chars_rejected(self, username):
        """
        **Validates: Requirements 3.3**

        Usernames with characters outside [a-z0-9.,] should be rejected.
        """
        lowered = username.strip().lower()
        assume(not re.match(r'^[a-z0-9.,]+$', lowered))
        assume(len(lowered) >= 3)

        error = validate_username(username)
        self.assertIsNotNone(error,
                             f"Username '{username}' with invalid chars was not rejected")

    # ===== PASSWORD TESTS =====

    @h_settings(**_PROP_SETTINGS)
    @given(password=valid_password_strategy())
    def test_valid_password_accepted(self, password):
        """
        **Validates: Requirements 3.5**

        Valid passwords (>=6 chars, uppercase, lowercase, digit, special) should be accepted.
        """
        error = validate_password(password)
        self.assertIsNone(error,
                          f"Valid password rejected: {error}")

    @h_settings(**_PROP_SETTINGS)
    @given(password=invalid_password_too_short_strategy())
    def test_invalid_password_too_short_rejected(self, password):
        """
        **Validates: Requirements 3.5**

        Passwords shorter than 6 characters should be rejected.
        """
        error = validate_password(password)
        self.assertIsNotNone(error,
                             f"Short password '{password}' was not rejected")

    @h_settings(**_PROP_SETTINGS)
    @given(password=invalid_password_no_uppercase_strategy())
    def test_invalid_password_no_uppercase_rejected(self, password):
        """
        **Validates: Requirements 3.5**

        Passwords without uppercase letters should be rejected.
        """
        error = validate_password(password)
        self.assertIsNotNone(error,
                             f"Password without uppercase was not rejected")

    @h_settings(**_PROP_SETTINGS)
    @given(password=invalid_password_no_lowercase_strategy())
    def test_invalid_password_no_lowercase_rejected(self, password):
        """
        **Validates: Requirements 3.5**

        Passwords without lowercase letters should be rejected.
        """
        error = validate_password(password)
        self.assertIsNotNone(error,
                             f"Password without lowercase was not rejected")

    @h_settings(**_PROP_SETTINGS)
    @given(password=invalid_password_no_digit_strategy())
    def test_invalid_password_no_digit_rejected(self, password):
        """
        **Validates: Requirements 3.5**

        Passwords without digits should be rejected.
        """
        error = validate_password(password)
        self.assertIsNotNone(error,
                             f"Password without digit was not rejected")

    @h_settings(**_PROP_SETTINGS)
    @given(password=invalid_password_no_special_strategy())
    def test_invalid_password_no_special_rejected(self, password):
        """
        **Validates: Requirements 3.5**

        Passwords without special characters should be rejected.
        """
        error = validate_password(password)
        self.assertIsNotNone(error,
                             f"Password without special char was not rejected")

    # ===== CNPJ TESTS =====

    @h_settings(**_PROP_SETTINGS)
    @given(cnpj=valid_cnpj_strategy())
    def test_valid_cnpj_accepted(self, cnpj):
        """
        **Validates: Requirements 3.4**

        Valid CNPJ (exactly 14 digits) should be accepted when non-empty.
        """
        error = validate_cnpj(cnpj)
        self.assertIsNone(error,
                          f"Valid CNPJ '{cnpj}' rejected: {error}")

    @h_settings(**_PROP_SETTINGS)
    @given(cnpj=invalid_cnpj_strategy())
    def test_invalid_cnpj_rejected(self, cnpj):
        """
        **Validates: Requirements 3.4**

        CNPJ with != 14 digits should be rejected when non-empty.
        """
        error = validate_cnpj(cnpj)
        self.assertIsNotNone(error,
                             f"Invalid CNPJ '{cnpj}' ({len(cnpj)} digits) was not rejected")

    # ===== TELEFONE TESTS =====

    @h_settings(**_PROP_SETTINGS)
    @given(telefone=valid_telefone_strategy())
    def test_valid_telefone_accepted(self, telefone):
        """
        **Validates: Requirements 3.4**

        Valid telefone (10 or 11 digits) should be accepted when non-empty.
        """
        error = validate_telefone(telefone)
        self.assertIsNone(error,
                          f"Valid telefone '{telefone}' rejected: {error}")

    @h_settings(**_PROP_SETTINGS)
    @given(telefone=invalid_telefone_strategy())
    def test_invalid_telefone_rejected(self, telefone):
        """
        **Validates: Requirements 3.4**

        Telefone with != 10 or 11 digits should be rejected when non-empty.
        """
        error = validate_telefone(telefone)
        self.assertIsNotNone(error,
                             f"Invalid telefone '{telefone}' ({len(telefone)} digits) was not rejected")
