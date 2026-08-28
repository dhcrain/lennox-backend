"""Loads unit IPs/labels and the API token from a YAML config file."""

from __future__ import annotations

import os
from dataclasses import dataclass

import yaml

CONFIG_PATH_ENV = "LENNOX_BACKEND_CONFIG"
DEFAULT_CONFIG_PATH = "config.yaml"


@dataclass(frozen=True)
class UnitConfig:
    id: str
    label: str
    ip: str


@dataclass(frozen=True)
class AppConfig:
    units: list[UnitConfig]
    api_token: str


def load_config(path: str | None = None) -> AppConfig:
    path = path or os.environ.get(CONFIG_PATH_ENV, DEFAULT_CONFIG_PATH)
    with open(path, "r") as f:
        raw = yaml.safe_load(f)

    if not raw or "units" not in raw:
        raise ValueError(f"{path}: missing top-level 'units' list")
    if not raw.get("api_token"):
        raise ValueError(f"{path}: missing 'api_token'")

    units = [UnitConfig(id=u["id"], label=u["label"], ip=u["ip"]) for u in raw["units"]]
    if not units:
        raise ValueError(f"{path}: 'units' list is empty")

    return AppConfig(units=units, api_token=raw["api_token"])
