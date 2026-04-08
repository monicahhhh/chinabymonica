# Diagnosis

The /about route works on the live site, which means Manus hosting has SPA fallback configured.
The /cn route shows 404 with OLD code (button-based language toggle, not link-based).
This means the user has NOT yet republished the latest checkpoint (f6ee9b48).

The fix is simply to republish. The SPA fallback is already working (proven by /about working).
The user needs to click Publish again to deploy the latest code with /cn routes.
