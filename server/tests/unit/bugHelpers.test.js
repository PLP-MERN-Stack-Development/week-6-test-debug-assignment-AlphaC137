const Bug = require('../../src/models/Bug');

describe('Bug model validation', () => {
  it('should require title and description', async () => {
    const bug = new Bug({});
    let err;
    try {
      await bug.validate();
    } catch (e) {
      err = e;
    }
    expect(err.errors.title).toBeDefined();
    expect(err.errors.description).toBeDefined();
  });

  it('should default status to open', () => {
    const bug = new Bug({ title: 't', description: 'd' });
    expect(bug.status).toBe('open');
  });
});
