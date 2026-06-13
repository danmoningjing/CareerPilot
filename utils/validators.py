REQUIRED_PROFILE_FIELDS = ["education", "stage", "major", "city", "skills", "experience"]


def validate_profile(profile):
    return [field for field in REQUIRED_PROFILE_FIELDS if not profile.get(field)]
