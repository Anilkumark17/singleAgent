const { eq } = require("drizzle-orm");
const { db } = require("../database/db");
const { users } = require("../database/schema");

class UserRepository {
  async create({ name, email, password, role = "user" }) {
    const [user] = await db
      .insert(users)
      .values({ name, email, password, role })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      });

    return user;
  }

  async findByEmail(email) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }

  async findById(id) {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  }
}

module.exports = new UserRepository();
