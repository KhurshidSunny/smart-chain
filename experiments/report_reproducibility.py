"""Shared helpers for deterministic experiment reports and drift checks."""

from __future__ import annotations

import hashlib
import importlib.metadata
import sys
from pathlib import Path
from typing import Iterable, Sequence

EXPERIMENTS_DIR = Path(__file__).resolve().parent
REPO_ROOT = EXPERIMENTS_DIR.parent
RANDOM_SEED = 42
STABLE_COMMAND = "python generate_reports.py"
PACKAGE_NAMES = ("numpy", "pandas", "scikit-learn")
REQUIREMENTS_PATH = EXPERIMENTS_DIR / "requirements.txt"
CRITICAL_PINS = ("scikit-learn",)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def repo_relative(path: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return path.name


def dataset_hashes(paths: Sequence[Path]) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    for path in paths:
        resolved = path.resolve()
        rows.append((repo_relative(resolved), sha256_file(resolved)))
    return rows


def pinned_versions(path: Path = REQUIREMENTS_PATH) -> dict[str, str]:
    pins: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "==" not in line:
            continue
        name, version = line.split("==", 1)
        pins[name.strip()] = version.strip()
    missing = [name for name in PACKAGE_NAMES if name not in pins]
    if missing:
        raise ValueError(f"{path} is missing pins for: {', '.join(missing)}")
    return {name: pins[name] for name in PACKAGE_NAMES}


def installed_versions() -> dict[str, str]:
    return {name: importlib.metadata.version(name) for name in PACKAGE_NAMES}


def package_versions() -> dict[str, str]:
    return pinned_versions()


def environment_mismatches() -> list[str]:
    pins = pinned_versions()
    installed = installed_versions()
    mismatches: list[str] = []
    for name in CRITICAL_PINS:
        if installed.get(name) != pins[name]:
            mismatches.append(
                f"{name} installed {installed.get(name, 'missing')} != pin {pins[name]}"
            )
    return mismatches


def require_pinned_environment() -> None:
    mismatches = environment_mismatches()
    if mismatches:
        detail = "; ".join(mismatches)
        raise SystemExit(
            "Install experiments/requirements.txt before generating reports "
            f"({detail})."
        )


def python_version_label() -> str:
    info = sys.version_info
    return f"{info.major}.{info.minor}"


def run_manifest(*, datasets: Sequence[Path], seed: int = RANDOM_SEED) -> dict[str, object]:
    return {
        "command": STABLE_COMMAND,
        "seed": seed,
        "python": python_version_label(),
        "packages": package_versions(),
        "datasets": [
            {"path": relative, "sha256": digest}
            for relative, digest in dataset_hashes(datasets)
        ],
    }


def normalize_newlines(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def finalize_text(text: str) -> str:
    normalized = normalize_newlines(text).rstrip() + "\n"
    return normalized


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(finalize_text(text))


def read_normalized(path: Path) -> str:
    return finalize_text(path.read_text(encoding="utf-8"))


def texts_match(expected: str, actual: str) -> bool:
    return finalize_text(expected) == finalize_text(actual)


def reproducibility_markdown(
    *,
    datasets: Sequence[Path],
    seed: int = RANDOM_SEED,
    command: str = STABLE_COMMAND,
) -> str:
    lines = [
        "## Reproducibility",
        "",
        f"- Command: `{command}`",
        f"- Random seed: **{seed}**",
        f"- Python: **{python_version_label()}**",
    ]
    packages = package_versions()
    package_text = ", ".join(f"{name} {versions}" for name, versions in packages.items())
    lines.append(f"- Packages: {package_text}")
    lines.extend(["", "Dataset SHA-256:", ""])
    for relative, digest in dataset_hashes(datasets):
        lines.append(f"- `{relative}`: `{digest}`")
    lines.extend(
        [
            "",
            "Regenerate or check drift (writes to a temp folder in `--check`;",
            "does not overwrite committed files during validation):",
            "",
            "```powershell",
            "cd experiments",
            "python generate_reports.py",
            "python generate_reports.py --check",
            "```",
            "",
        ]
    )
    return "\n".join(lines)


def append_reproducibility(
    markdown: str,
    *,
    datasets: Sequence[Path],
    seed: int = RANDOM_SEED,
) -> str:
    body = normalize_newlines(markdown).rstrip()
    return finalize_text(body + "\n\n" + reproducibility_markdown(datasets=datasets, seed=seed))


def format_json_manifest(manifest: dict[str, object]) -> str:
    import json

    return finalize_text(json.dumps(manifest, indent=2, sort_keys=True))


def compare_outputs(
    pairs: Iterable[tuple[Path, Path]],
) -> list[str]:
    """Return human-readable drift messages. Empty list means all files match."""
    drifts: list[str] = []
    for committed, generated in pairs:
        if not committed.is_file():
            drifts.append(f"missing committed file: {repo_relative(committed)}")
            continue
        if not generated.is_file():
            drifts.append(f"missing generated file: {repo_relative(generated)}")
            continue
        if not texts_match(read_normalized(committed), read_normalized(generated)):
            drifts.append(
                f"drift: {repo_relative(committed)} != generated {generated.name}"
            )
    return drifts
