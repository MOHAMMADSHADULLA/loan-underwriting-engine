"""Synthetic demographic, financial and employment distributions."""

import random
from datetime import date, datetime, timedelta
from typing import List, Tuple

FIRST_NAMES: List[str] = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
    "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
    "Matthew", "Margaret", "Anthony", "Betty", "Donald", "Sandra", "Mark", "Ashley",
    "Paul", "Kimberly", "Steven", "Emily", "Andrew", "Donna", "Kenneth", "Michelle",
    "Joshua", "Carol", "Kevin", "Amanda", "Brian", "Dorothy", "George", "Melissa",
    "Edward", "Deborah", "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon",
    "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy",
    "Nicholas", "Angela", "Eric", "Shirley", "Jonathan", "Anna", "Stephen", "Brenda",
    "Larry", "Pamela", "Justin", "Emma", "Scott", "Nicole", "Brandon", "Helen",
    "Benjamin", "Samantha", "Samuel", "Katherine", "Gregory", "Christine", "Frank", "Debra",
    "Alexander", "Rachel", "Raymond", "Carolyn", "Patrick", "Janet", "Jack", "Catherine",
    "Dennis", "Maria", "Jerry", "Heather", "Tyler", "Diane", "Aaron", "Ruth"
]

LAST_NAMES: List[str] = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill",
    "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell",
    "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz"
]

EMPLOYERS: List[str] = [
    "Apex Global Logistics", "Summit Health Systems", "NextGen Software Corp",
    "Meridian Financial Services", "Pinnacle Manufacturing Ltd", "Vanguard Retail Group",
    "Horizon Renewable Energy", "Atlas Construction & Infra", "Beacon Hospitality Inc",
    "Omni Media Network", "Cascade BioTech", "Nova Cloud Innovations",
    "Frontier Telecom", "Zenith Logistics Partners", "TrueNorth Consulting Group"
]

JOB_TITLES: List[str] = [
    "Software Engineer", "Clinical Nurse Specialist", "Financial Analyst",
    "Operations Manager", "Supply Chain Lead", "Account Executive",
    "Mechanical Technician", "Product Designer", "Compliance Officer",
    "Data Analyst", "Marketing Coordinator", "Human Resources Generalist",
    "Executive Assistant", "Electrical Engineer", "Warehouse Supervisor"
]

LENDERS: List[str] = [
    "JPMorgan Chase", "Bank of America", "Wells Fargo", "Citibank",
    "Capital One", "Discover Bank", "U.S. Bank", "Barclays", "PNC Bank", "TD Bank"
]


def sample_credit_score(rng: random.Random) -> int:
    """
    Samples realistic FICO-like credit score distributed between 520 and 820
    with peak around 690-720.
    """
    val = rng.gauss(mu=695, sigma=70)
    score = int(round(val))
    return max(520, min(820, score))


def sample_gross_monthly_income(rng: random.Random) -> float:
    """
    Samples monthly gross income with realistic lognormal shape.
    Median around $4,800, range from $1,800 to $25,000+.
    """
    # Lognormal distribution: mu ~ 8.4, sigma ~ 0.45 => exp(8.4) ~ $4447
    base = rng.lognormvariate(mu=8.45, sigma=0.42)
    amount = max(1800.0, min(32000.0, base))
    return round(amount, 2)


def sample_date_between(rng: random.Random, start: date, end: date) -> date:
    days_range = (end - start).days
    random_days = rng.randint(0, max(0, days_range))
    return start + timedelta(days=random_days)


def sample_datetime_between(rng: random.Random, start: datetime, end: datetime) -> datetime:
    seconds_range = int((end - start).total_seconds())
    random_seconds = rng.randint(0, max(0, seconds_range))
    return start + timedelta(seconds=random_seconds)
