# 🚀 Deployment Runbook

## Git Workflow

```bash
git status
git add .
git commit -m "message (#issue-number)"
git push origin main
```

## Build (Expo / EAS)

```bash
npx eas build --platform ios
npx eas submit --platform ios
```

## Rules

- Always link commits to issues
- Never release without completing testing checklist
- Always test on real device

---

## 🔗 See Also

- [Testing Checklist](./testing-checklist.md)
- [TestFlight Checklist](./testflight-checklist.md)
- [v1 Scope](./v1-scope.md)
- [Documentation Index](../README.md)
