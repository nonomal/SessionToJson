(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SessionToJsonConverter = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CONVERSION_RULES = [
    { from: 'accessToken', to: 'access_token' },
    { from: 'account.id', to: 'account_id' },
    { from: 'user.email', to: 'email' },
    { from: 'expires', to: 'expired' },
    { from: 'account.id', to: 'chatgpt_account_id' },
    { from: 'account.planType', to: 'plan_type' },
    { from: 'account.planType', to: 'chatgpt_plan_type' },
    { from: 'sessionToken', to: 'session_token' },
    { to: 'last_refresh', value: '' },
    { to: 'refresh_token', value: '' },
    { to: 'type', value: 'codex' },
    { to: 'disabled', value: false },
    { to: 'id_token_synthetic', value: true }
  ];

  function convertSessionJson(source) {
    const output = {};
    const warnings = [];

    for (const rule of CONVERSION_RULES) {
      if (Object.prototype.hasOwnProperty.call(rule, 'value')) {
        writePath(output, rule.to, rule.value);
        continue;
      }

      const resolved = readPath(source, rule.from);
      if (!resolved.found) {
        warnings.push(`Missing value for path "${rule.from}"`);
        continue;
      }

      writePath(output, rule.to, resolved.value);
    }

    writePath(
      output,
      'id_token',
      buildIdToken(
        readPath(source, 'user.email').value,
        readPath(source, 'account.id').value,
        readPath(source, 'account.planType').value,
        readPath(source, 'user.id').value,
        readPath(source, 'expires').value
      )
    );

    return { output, warnings };
  }

  function buildIdToken(email, accountId, planType, userId, expires) {
    if (!accountId) {
      return '';
    }

    const now = Math.trunc(Date.now() / 1000);
    const exp = epochFromValue(expires) || now + 90 * 24 * 60 * 60;
    const authInfo = { chatgpt_account_id: accountId };

    if (planType) {
      authInfo.chatgpt_plan_type = planType;
    }

    if (userId) {
      authInfo.chatgpt_user_id = userId;
      authInfo.user_id = userId;
    }

    const payload = {
      iat: now,
      exp,
      'https://api.openai.com/auth': authInfo
    };

    if (email) {
      payload.email = email;
    }

    return `${genBase64({ alg: 'none', typ: 'JWT', cpa_synthetic: true })}.${genBase64(payload)}.`;
  }

  function epochFromValue(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.trunc(value);
    }

    if (typeof value === 'string' && value.trim()) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return Math.trunc(numeric);
      }

      const parsed = Date.parse(value);
      if (Number.isFinite(parsed)) {
        return Math.trunc(parsed / 1000);
      }
    }

    return 0;
  }

  function genBase64(value) {
    const json = JSON.stringify(value);

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(json, 'utf8').toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }

    return btoa(unescape(encodeURIComponent(json))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  function readPath(source, path) {
    const parts = path.split('.').filter(Boolean);
    let current = source;

    for (const part of parts) {
      if (!hasOwn(current, part)) {
        return { found: false };
      }

      current = current[part];
    }

    return { found: true, value: current };
  }

  function writePath(target, path, value) {
    const parts = path.split('.').filter(Boolean);
    let current = target;

    for (let index = 0; index < parts.length - 1; index += 1) {
      const part = parts[index];

      if (!hasOwn(current, part) || current[part] === null || typeof current[part] !== 'object' || Array.isArray(current[part])) {
        current[part] = {};
      }

      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  function hasOwn(value, key) {
    return value !== null && (typeof value === 'object' || typeof value === 'function') && Object.prototype.hasOwnProperty.call(value, key);
  }

  return { convertSessionJson };
});
