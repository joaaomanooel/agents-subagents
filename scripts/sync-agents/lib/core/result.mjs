export const ok = (value) => ({ ok: true, value });
export const err = (error) => ({ ok: false, error });
export const isOk = (r) => Boolean(r) && r.ok === true;
