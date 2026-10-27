"""Print only the current MV workflow stage's context; persist stage status."""
from __future__ import annotations
import argparse, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "mv-workflow" / "workflow.json"
STATE = ROOT / "workflow" / "state.json"
MAX_CHARS = 3200

def load():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8-sig"))
    state = json.loads(STATE.read_text(encoding="utf-8-sig")) if STATE.exists() else {"completed": [], "active": None}
    return manifest, state

def save(state):
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("next", help="show the next incomplete stage and only its text context")
    d = sub.add_parser("done", help="mark a stage complete")
    d.add_argument("stage")
    sub.add_parser("status", help="show stage completion")
    args = p.parse_args()
    manifest, state = load()
    stages = manifest["stages"]
    ids = [s["id"] for s in stages]
    if args.cmd == "status":
        print(json.dumps({"completed": state["completed"], "active": state.get("active"), "remaining": [x for x in ids if x not in state["completed"]]}, ensure_ascii=False, indent=2)); return
    if args.cmd == "done":
        if args.stage not in ids: p.error(f"unknown stage: {args.stage}")
        if args.stage not in state["completed"]: state["completed"].append(args.stage)
        state["active"] = None; save(state); print(f"Completed: {args.stage}"); return
    stage = next((s for s in stages if s["id"] not in state["completed"]), None)
    if not stage:
        print("All manifest stages are marked complete."); return
    state["active"] = stage["id"]; save(state)
    print(f"STAGE: {stage['id']}\nWRITE TARGETS: {json.dumps(stage['writes'], ensure_ascii=False)}\n")
    for rel in stage["reads"]:
        f = ROOT / rel
        if not f.is_file():
            print(f"--- {rel} [missing] ---"); continue
        if f.suffix.lower() not in {".md", ".txt", ".json", ".js", ".ps1", ".py", ".html", ".srt"}:
            print(f"--- {rel} [non-text; omitted] ---"); continue
        content = f.read_text(encoding="utf-8-sig", errors="replace")
        print(f"--- {rel} ---\n{content[:MAX_CHARS]}")
        if len(content) > MAX_CHARS: print(f"[truncated; {len(content)} chars total]")

if __name__ == "__main__": main()
