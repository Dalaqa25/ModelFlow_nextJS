# 2026 Application Update Evidence

This note summarizes Git/GitHub history and Vercel deployment records for the `ModelGrow` application.

## Conclusion

Yes, there were application updates in February 2026.

Evidence:

- Git history shows 9 commits on `origin/main` between February 3 and February 23, 2026.
- Git history also shows a Vercel-authored security update branch on February 23, 2026.
- Vercel deployment history shows a successful Ready preview deployment created on February 23, 2026 from the Vercel security branch.

## Extended Evidence: January 25-July 1, 2026

This section expands the proof window to one week before February 2026 and continues through today, July 1, 2026.

GitHub refresh command used before collecting history:

```bash
git fetch --all --prune
```

GitHub commit command used:

```bash
git log origin/main --since='2026-01-25 00:00:00' --until='2026-07-01 23:59:59' --date=iso --pretty=format:'%H %ad %an %s'
```

GitHub summary for `origin/main`:

- Range checked: January 25, 2026 through July 1, 2026
- Commits found on GitHub `origin/main`: 55
- Date range of commits found: January 30, 2026 through May 30, 2026
- Total touched across these commits: 476 file changes, 28,009 insertions, 13,217 deletions
- Latest GitHub `origin/main` commit in this range: `1164bb1a347bdc835ffa643a64d1d5b8284cae80` on May 30, 2026

Note: local branch `main` also has local commit `05dc1837bd48c9d4d5fe37cacceed8b90e2faa02` dated June 7, 2026 with message `Integration with activepices`, but it is not on GitHub `origin/main` according to the refreshed remote state.

### GitHub Commit History

| Date | Short | Full commit | Author | Message |
| --- | --- | --- | --- | --- |
| 2026-05-30 | `1164bb1` | `1164bb1a347bdc835ffa643a64d1d5b8284cae80` | Dalaqa25 | FIX braodcasr request rate limit |
| 2026-05-30 | `4c9794d` | `4c9794d329f742b028006c3d00885385c32fd30b` | Dalaqa25 | Performance optimization |
| 2026-05-28 | `56481ed` | `56481ed0c574d44fea45ac89a9caf7a83653c4f1` | Dalaqa25 | FIX: design fo the messages |
| 2026-05-21 | `81bd198` | `81bd1980840a212ee74434781a24653fe9ff8628` | Dalaqa25 | FIX: new design need for this |
| 2026-05-21 | `af780d9` | `af780d9462b9f6563c2cf79f7badea2a2df674c5` | Dalaqa25 | Feat: new built in chat messages with some lacking features... |
| 2026-05-15 | `8ba8190` | `8ba8190d4ca3319f45b4ac5bea89767dbe594deb` | Dalaqa25 | security: rotate keys, fix hardcoded secret, add smoke test pre-push hook |
| 2026-05-15 | `0fc0ac7` | `0fc0ac7384ec3b69e8e48df8decc853ceb157b50` | Dalaqa25 | Uplading issue |
| 2026-05-13 | `7576f48` | `7576f486ec032c8d9c823c3df497d8cb58ef07ae` | Dalaqa25 | FIX: MAGARI KACI |
| 2026-05-12 | `b348019` | `b348019c170e5443ae09e97c2d2f4bce33c4afb6` | Dalaqa25 | ModelGrow Huge Chnages for entire payment system |
| 2026-05-06 | `c4778fd` | `c4778fde6077e02fb11aef06214c78cc125c9699` | Dalaqa25 | new version on ladnig page |
| 2026-05-04 | `805de09` | `805de09df690bf7dd97e4675a67caaf13f62432b` | Dalaqa25 | Require authentication for automations and messaging |
| 2026-05-04 | `2ca42b1` | `2ca42b14ff6510b8f0875adaaf9ca023d827ffb5` | Dalaqa25 | Remove upload automation tooltip and glow effect |
| 2026-05-03 | `39baf67` | `39baf6793070c7c1f3391d714a7a4567b8e77e53` | Dalaqa25 | Fix: Only show automation badges when user is authenticated |
| 2026-05-03 | `e7f9355` | `e7f93557966ab3281fa93f5f772964cb38c9c717` | Dalaqa25 | Require authentication for automation badge clicks |
| 2026-05-02 | `cf78b1d` | `cf78b1d4aac73eb92ffd3c684d52fc776f206d87` | Dalaqa25 | Add Auto Parts Search badge to mobile view |
| 2026-05-02 | `f5ab01d` | `f5ab01d1268099a324948015ac294eb8cef9a4a9` | Dalaqa25 | Security: Sanitize logging in AI stream and setup handlers |
| 2026-05-02 | `2859069` | `28590696b54ea9f8cf82d5841828b5443e232d15` | Dalaqa25 | Car searching automation |
| 2026-04-30 | `4d96704` | `4d967042c11038cf22f9d5cd5848d1e7e520421a` | Dalaqa25 | New stuff |
| 2026-04-03 | `23b5591` | `23b559128b264f9c8d82460608f5160a25a531f3` | Dalaqa25 | FIX: ds |
| 2026-04-01 | `372b859` | `372b859746e8b31498191b98a861183dbc7c9625` | Dalaqa25 | new badge added |
| 2026-04-01 | `ba70043` | `ba700438d35898e3362960bf0decaf9e38a5de79` | Dalaqa25 | FIX: err while ruunun |
| 2026-04-01 | `8dcd8f6` | `8dcd8f68360d1ec71a204540ce48d59a9c4377d7` | Dalaqa25 | Dignostics fixes |
| 2026-04-01 | `1238538` | `12385381a33d4c05039e7b42da5d073fc3b79a9d` | Dalaqa25 | FIX: er while ruuning |
| 2026-04-01 | `62f6819` | `62f6819fbd178c8c38f884822816cee30b6933bf` | Dalaqa25 | New update for jobs |
| 2026-03-31 | `687569c` | `687569ca43fd13fe0f383cb10c7eea921d30d477` | Dalaqa25 | FIX: lot of stuff |
| 2026-03-29 | `0a996a7` | `0a996a7d28d9dbc1742407c3d4312d21f3300615` | Dalaqa25 | FIX: comuntiy |
| 2026-03-29 | `8e48215` | `8e482151c04693fd801c1a1bbc4ac83dc7ed4974` | Dalaqa25 | FIX: community page |
| 2026-03-29 | `ead2fb0` | `ead2fb01aa843e68c0c400fc9db8ac2338203f68` | Dalaqa25 | ds5 |
| 2026-03-27 | `880f18c` | `880f18c5892068744f4e5b82c653cce0a2cf58ac` | Dalaqa25 | FIX: ds |
| 2026-03-24 | `7d3c684` | `7d3c68480b7908ae3c9cc1d6ea4d769fdc8f429b` | Dalaqa25 | FIX: linkedin automation |
| 2026-03-22 | `48ab936` | `48ab936fee92ae98f3caa7a420e51f33c608c4e9` | Dalaqa25 | ds fix |
| 2026-03-22 | `a78f5fc` | `a78f5fc3d8fc575306c4d0ac9e9b037ab0c03cc0` | Dalaqa25 | FIX: chat |
| 2026-03-20 | `d3e0943` | `d3e094300b7eb4308a14d787eee28d035c9d9e2a` | Dalaqa25 | FIX: scorolling effect |
| 2026-03-18 | `dfb68dd` | `dfb68dd3d0111a0ea9ca5805e1a1cfab7e264d5f` | Dalaqa25 | minor fixes |
| 2026-03-16 | `7b10807` | `7b10807f30883606b4d73f8e258bf46215d83a91` | Dalaqa25 | FIX: dialog pop up |
| 2026-03-15 | `e670d15` | `e670d157282460c9b972ba58ef4e3e3e85796006` | Dalaqa25 | Fix: side bar on mobile |
| 2026-03-15 | `2bb0f3e` | `2bb0f3e866fcda7c3854345e20e7309429be7b1c` | Dalaqa25 | side bar on mobile |
| 2026-03-15 | `2c3cca0` | `2c3cca0c3607ead3832ca9cbbb0dc5276b22ba9b` | Dalaqa25 | ModelGrow v2 |
| 2026-03-15 | `e5e1420` | `e5e14207868aaf4be1bcaaca6de2b67b2a850355` | Dalaqa25 | new landing |
| 2026-03-14 | `bf2e4b4` | `bf2e4b41b8a0ce937b2a91167cdf391998c10c18` | Dalaqa25 | Heavy modification |
| 2026-03-09 | `27bab76` | `27bab7634c079dd57c3b32757844e34f581b27df` | Dalaqa25 | FEAT: compression |
| 2026-03-09 | `a3a8fbc` | `a3a8fbcb6e2eb86a4b1e60a6968bc4eff7009ce7` | Dalaqa25 | Fix: ds |
| 2026-03-08 | `a2e8b6d` | `a2e8b6d2f6e626847f9b99172aea5d4582c3593c` | Dalaqa25 | ds30.9 |
| 2026-02-23 | `ceb61f9` | `ceb61f9bd3980489cb9f1d9793505b3516c98cf2` | Dalaqa25 | TkTok verification |
| 2026-02-22 | `0c6232b` | `0c6232b2902720f786d8d89924f050f8dd58fdda` | Dalaqa25 | Chat id for specifc chat |
| 2026-02-22 | `dd42fbc` | `dd42fbc95c7d5e1ed97244fd62730854df4b8299` | Dalaqa25 | FIx main |
| 2026-02-21 | `0ba0d01` | `0ba0d01561a9042eb9048748acbe597f589b24a5` | Dalaqa25 | ds c |
| 2026-02-17 | `976a1f3` | `976a1f31468cb15703832b156dfba20edbb035e4` | Dalaqa25 | DS tiktok |
| 2026-02-06 | `2430b5d` | `2430b5d4b80583cba20accec3d24a2c425f16693` | Dalaqa25 | update with tktok privecy and terms |
| 2026-02-05 | `0926ca4` | `0926ca4e981b611409c16041f0960167a50a563a` | Dalaqa25 | ds100124300DS |
| 2026-02-03 | `92b6d60` | `92b6d607943155e49adc6107df60a729fb74da91` | Dalaqa25 | Fix: convo |
| 2026-02-03 | `c665409` | `c665409cf79b9818dcb8e211cbc63bd03945319e` | Dalaqa25 | ds-scope |
| 2026-01-30 | `adad530` | `adad53037464d40e9ab69569639a45a60a9fc7d2` | Giorgi Dalakishvili | ds |
| 2026-01-30 | `5d4ef0e` | `5d4ef0ea05f994439091ed7aa334d1743658b443` | dalaqa25 | ds00 |
| 2026-01-30 | `0ff75d2` | `0ff75d2f49f5425d7afcce7af61e62089eb6f851` | dalaqa25 | DS0 |

### Vercel Deployment History

Vercel commands used:

```bash
vercel ls model-flow-next-js --scope team_xxQQHOggza48DPQbX5xdArYW
vercel ls model-flow-next-js --scope team_xxQQHOggza48DPQbX5xdArYW --next 1775059994866
vercel inspect <deployment-url> --scope team_xxQQHOggza48DPQbX5xdArYW
```

Vercel summary:

- Deployments found in Vercel project history: 21
- Ready Production deployments found: 20
- Ready Preview deployments found: 1
- Date range of Vercel deployments found: February 23, 2026 through June 18, 2026
- Latest Vercel deployment found as of July 1, 2026: June 18, 2026 at 23:50:48 GMT+0400
- No July 1, 2026 deployment was shown in the Vercel deployment list.

| Created | Target | Status | Deployment id | URL |
| --- | --- | --- | --- | --- |
| Thu Jun 18 2026 23:50:48 GMT+0400 | production | Ready | `dpl_2hPHGJzyEuRTsmhMY9t1HztKekGx` | `https://model-flow-next-7ijchc4eg-giorgis-projects-fbd36172.vercel.app` |
| Thu Jun 18 2026 23:43:41 GMT+0400 | production | Ready | `dpl_CZQ3KEBpLAfkX1yH59UMK6MqE165` | `https://model-flow-next-kn1cr5x2o-giorgis-projects-fbd36172.vercel.app` |
| Thu Jun 18 2026 23:27:36 GMT+0400 | production | Ready | `dpl_5uH9nV6rUurPwY4qKodxEqsJ94Mx` | `https://model-flow-next-noq9rzjuk-giorgis-projects-fbd36172.vercel.app` |
| Sat May 30 2026 17:19:10 GMT+0400 | production | Ready | `dpl_2ZvnxTvPrUSgQzt4bjwsQUkP9EeK` | `https://model-flow-next-p8v2kke2j-giorgis-projects-fbd36172.vercel.app` |
| Sat May 30 2026 17:05:52 GMT+0400 | production | Ready | `dpl_GLGH8UmSy8TUEngDszsbGw4aGLo6` | `https://model-flow-next-6lewjxnh3-giorgis-projects-fbd36172.vercel.app` |
| Thu May 28 2026 15:01:34 GMT+0400 | production | Ready | `dpl_FiABvo76M5F6w5WosGZU8J3JEDBP` | `https://model-flow-next-mpxqnj8gn-giorgis-projects-fbd36172.vercel.app` |
| Thu May 28 2026 14:58:55 GMT+0400 | production | Ready | `dpl_5KJX1BwfArjNB9V3ohdaNmN5UwGS` | `https://model-flow-next-ia317ihd1-giorgis-projects-fbd36172.vercel.app` |
| Fri May 15 2026 18:45:29 GMT+0400 | production | Ready | `dpl_E6DnUsobCkXoeofDEyDHwm7XxRVW` | `https://model-flow-next-kejgzes28-giorgis-projects-fbd36172.vercel.app` |
| Fri May 15 2026 18:43:29 GMT+0400 | production | Ready | `dpl_3QZJxBSWaWePgpbFB7Nj17HwUVqG` | `https://model-flow-next-b6468y9t5-giorgis-projects-fbd36172.vercel.app` |
| Fri May 15 2026 16:15:11 GMT+0400 | production | Ready | `dpl_HeNWZ9z1M7dZELCwSMqdwePttntB` | `https://model-flow-next-5w1ph5ii9-giorgis-projects-fbd36172.vercel.app` |
| Wed May 13 2026 20:54:20 GMT+0400 | production | Ready | `dpl_2NaboxyEjzvgwzXYWaqUymPuS1jD` | `https://model-flow-next-r1uozxxj8-giorgis-projects-fbd36172.vercel.app` |
| Tue May 12 2026 16:22:12 GMT+0400 | production | Ready | `dpl_2N775Wk51P5id1656SRibXrQbjRn` | `https://model-flow-next-dq5ar4hn0-giorgis-projects-fbd36172.vercel.app` |
| Tue May 12 2026 16:13:58 GMT+0400 | production | Ready | `dpl_48tDm4KVMYKCAofztT5snCJiKfh4` | `https://model-flow-next-7uih1euqa-giorgis-projects-fbd36172.vercel.app` |
| Wed May 06 2026 23:58:51 GMT+0400 | production | Ready | `dpl_31u7bihkYwmN7nHrpfnbWjbx6C8Y` | `https://model-flow-next-mlfe1z54c-giorgis-projects-fbd36172.vercel.app` |
| Mon May 04 2026 11:01:06 GMT+0400 | production | Ready | `dpl_GComDTgv1GCjp2ghsuJ1hGpTiUkA` | `https://model-flow-next-13ax8qtg9-giorgis-projects-fbd36172.vercel.app` |
| Sat May 02 2026 19:13:13 GMT+0400 | production | Ready | `dpl_5N7nZfUYxwHQbFG2D4fvebYFbDeh` | `https://model-flow-next-qntu3ptb8-giorgis-projects-fbd36172.vercel.app` |
| Sat May 02 2026 18:36:54 GMT+0400 | production | Ready | `dpl_FN8XDpZXUag8xkxrjpGgeZV52Ktx` | `https://model-flow-next-4cwm9blie-giorgis-projects-fbd36172.vercel.app` |
| Thu Apr 30 2026 16:32:38 GMT+0400 | production | Ready | `dpl_CkxTTQkD3fXzvNazfys7mY3gpTqV` | `https://model-flow-next-n9jcvuwl3-giorgis-projects-fbd36172.vercel.app` |
| Fri Apr 03 2026 22:50:12 GMT+0400 | production | Ready | `dpl_AgTMYXefMGRdF5tfxKb1NwgfEaZ9` | `https://model-flow-next-q44bnvecf-giorgis-projects-fbd36172.vercel.app` |
| Wed Apr 01 2026 20:13:14 GMT+0400 | production | Ready | `dpl_9Hny7VDLBqVBQZgirrx9ofGvgnf7` | `https://model-flow-next-2qdrlsig7-giorgis-projects-fbd36172.vercel.app` |
| Mon Feb 23 2026 13:33:18 GMT+0400 | preview | Ready | `dpl_DUrxM5jzyT5mRrspL21V2G6gUM5b` | `https://model-flow-next-5ih72mn4t-giorgis-projects-fbd36172.vercel.app` |

## Vercel Project

- Project: `giorgis-projects-fbd36172/model-flow-next-js`
- Project id from `.vercel/repo.json`: `prj_X2sxVsXzzmsPeie9B81GM6ro9OWs`
- Team/org id from `.vercel/repo.json`: `team_xxQQHOggza48DPQbX5xdArYW`

## Vercel Deployment Proof

Command used:

```bash
vercel ls model-flow-next-js --scope team_xxQQHOggza48DPQbX5xdArYW --next 1775059994866
```

Result:

- Deployment URL: `https://model-flow-next-5ih72mn4t-giorgis-projects-fbd36172.vercel.app`
- Status: `Ready`
- Environment: `Preview`
- Username: `dalaqa25`
- Age shown by Vercel on June 30, 2026: `127d`

Inspection command:

```bash
vercel inspect https://model-flow-next-5ih72mn4t-giorgis-projects-fbd36172.vercel.app --scope team_xxQQHOggza48DPQbX5xdArYW
```

Inspection result:

- Deployment id: `dpl_DUrxM5jzyT5mRrspL21V2G6gUM5b`
- Target: `preview`
- Status: `Ready`
- Created: `Mon Feb 23 2026 13:33:18 GMT+0400 (Georgia Standard Time)`
- Alias: `https://model-flow-next-js-git-vercel-e63332-giorgis-projects-fbd36172.vercel.app`

Build log proof:

```text
2026-02-23T09:33:20.114Z Cloning github.com/Dalaqa25/ModelFlow_nextJS (Branch: vercel/react-server-components-cve-vu-2l91xa, Commit: c3e72a2)
2026-02-23T09:33:31.687Z Detected Next.js version: 16.0.10
2026-02-23T09:33:54.651Z Compiled successfully in 21.7s
2026-02-23T09:34:10.196Z Deployment completed
```

The build output included application routes such as:

- `/api/auth/tiktok`
- `/api/auth/tiktok/callback`
- `/api/webhook/tiktok`
- `/api/conversations`
- `/api/conversations/[id]`
- `/api/automations/upload`
- `/main`
- `/dashboard`
- `/google-permissions`
- `/privacy`
- `/terms`

## Git Commit Proof

Command used:

```bash
git log origin/main --since='2026-02-01 00:00:00' --until='2026-02-29 23:59:59' --date=iso --pretty=format:'%H %ad %an %s'
```

This command shows the February 2026 commit history from the application repository's `origin/main` branch.

Summary:

- February 2026 `origin/main` commits: 9
- Date range: February 3, 2026 through February 23, 2026
- Author shown in Git history: `Dalaqa25`
- Total touched across these commits: 151 file changes, 10,879 insertions, 4,598 deletions

Commits on `origin/main`:

| Date | Commit | Author | Message |
| --- | --- | --- | --- |
| 2026-02-23 13:28:56 +0400 | `ceb61f9bd3980489cb9f1d9793505b3516c98cf2` | Dalaqa25 | TkTok verification |
| 2026-02-22 18:24:33 +0400 | `0c6232b2902720f786d8d89924f050f8dd58fdda` | Dalaqa25 | Chat id for specifc chat |
| 2026-02-22 11:38:03 +0400 | `dd42fbc95c7d5e1ed97244fd62730854df4b8299` | Dalaqa25 | FIx main |
| 2026-02-21 18:05:21 +0400 | `0ba0d01561a9042eb9048748acbe597f589b24a5` | Dalaqa25 | ds c |
| 2026-02-17 11:40:57 +0400 | `976a1f31468cb15703832b156dfba20edbb035e4` | Dalaqa25 | DS tiktok |
| 2026-02-06 11:21:14 +0400 | `2430b5d4b80583cba20accec3d24a2c425f16693` | Dalaqa25 | update with tktok privecy and terms |
| 2026-02-05 00:16:29 +0400 | `0926ca4e981b611409c16041f0960167a50a563a` | Dalaqa25 | ds100124300DS |
| 2026-02-03 12:31:41 +0400 | `92b6d607943155e49adc6107df60a729fb74da91` | Dalaqa25 | Fix: convo |
| 2026-02-03 01:11:13 +0400 | `c665409cf79b9818dcb8e211cbc63bd03945319e` | Dalaqa25 | ds-scope |

Commit-by-commit change volume from `git log --shortstat`:

| Date | Short commit | Message | Files changed | Insertions | Deletions |
| --- | --- | --- | ---: | ---: | ---: |
| 2026-02-23 | `ceb61f9` | TkTok verification | 3 | 51 | 36 |
| 2026-02-22 | `0c6232b` | Chat id for specifc chat | 9 | 256 | 126 |
| 2026-02-22 | `dd42fbc` | FIx main | 5 | 119 | 17 |
| 2026-02-21 | `0ba0d01` | ds c | 21 | 1,294 | 151 |
| 2026-02-17 | `976a1f3` | DS tiktok | 42 | 3,481 | 1,851 |
| 2026-02-06 | `2430b5d` | update with tktok privecy and terms | 5 | 1,000 | 2 |
| 2026-02-05 | `0926ca4` | ds100124300DS | 14 | 481 | 260 |
| 2026-02-03 | `92b6d60` | Fix: convo | 15 | 87 | 1,757 |
| 2026-02-03 | `c665409` | ds-scope | 37 | 4,110 | 398 |

Important February commits by application area:

- `c665409` on February 3 added Smart OAuth/scope work, Google permission UI, auth helpers, automation scope detection, and migration scripts.
- `0926ca4` on February 5 updated AI stream handling, Google auth routing, background automation activation, scope detection, and scope validation.
- `2430b5d` on February 6 added or updated TikTok/Google verification documents and changed the privacy and terms pages.
- `976a1f3` on February 17 added TikTok auth routes, TikTok webhook handling, automation upload/execute changes, video compression utilities, AI tool handling, and test storage routes.
- `0ba0d01` on February 21 added conversation APIs, message APIs, conversation database helpers, sidebar conversation UI, and a Supabase migration for conversations/messages.
- `dd42fbc` and `0c6232b` on February 22 updated the main app screen, chat behavior, sidebar conversation list, and conversation id handling.
- `ceb61f9` on February 23 updated signup/home/footer UI connected to TikTok verification.

Additional February commit visible in all Git refs:

| Date | Commit | Author | Message |
| --- | --- | --- | --- |
| 2026-02-23 09:33:15 +0000 | `c3e72a24a30609912fb0562e65a912a6c7456530` | Vercel | Fix React Server Components CVE vulnerabilities |

This additional commit is on the remote branch `origin/vercel/react-server-components-cve-vu-2l91xa`. It is not part of the `origin/main` table above, but it is important because Vercel's February deployment logs show this exact branch and commit were built and deployed.

## What Changed

Major application areas touched during February 2026:

- Google OAuth/scope handling and permission pages.
- TikTok OAuth, callback, refresh, webhook, and verification-related work.
- Automation upload, activation, execution, and background activation flows.
- AI chat streaming and tool handling.
- Conversation APIs, message routes, sidebar conversation UI, and database migration.
- Privacy and terms pages.
- Next.js security dependency update by Vercel.

Notable file-level evidence:

- `app/api/auth/tiktok/route.js`
- `app/api/auth/tiktok/callback/route.js`
- `app/api/auth/tiktok/refresh/route.js`
- `app/api/webhook/tiktok/route.js`
- `lib/auth/tiktok-oauth.js`
- `app/api/conversations/route.js`
- `app/api/conversations/[id]/route.js`
- `app/api/conversations/[id]/messages/route.js`
- `lib/db/conversation-db.js`
- `supabase/migrations/create_conversations_and_messages_tables.sql`
- `app/privacy/page.jsx`
- `app/terms/page.jsx`
- `package.json`
- `package-lock.json`

## Security Update Detail

Commit `c3e72a24a30609912fb0562e65a912a6c7456530` changed `package.json`:

```diff
-    "next": "^16.0.8",
+    "next": "16.0.10",
```

The commit message states that Vercel updated dependencies to fix React Server Components CVE vulnerabilities.
