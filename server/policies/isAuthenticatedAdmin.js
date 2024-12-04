module.exports = async (ctx, next) => {
  // Get the authorization header
  const authHeader = ctx.request.header.authorization;

  // If no authorization header is found, throw an error
  if (!authHeader) {
    return ctx.unauthorized("Authorization header missing.");
  }

  // Extract the token from the authorization header
  const token = authHeader.split(" ")[1];

  if (!token) {
    return ctx.unauthorized("Token missing.");
  }

  try {
    console.log(token);
    // Verify the JWT token
    const decodedToken = await strapi
      .plugin("users-permissions")
      .service("jwt")
      .verify(token);

    // Check if the decoded user has the "Administrator" role
    const user = await strapi
      .query("plugin::users-permissions.user")
      .findOne({ where: { id: decodedToken.id } });
    console.log(user);
    if (!user || user.role.name !== "Administrator") {
      return ctx.forbidden("You are not an admin.");
    }

    // Attach the user to the context and proceed
    ctx.state.user = user;
    return await next();
  } catch (error) {
    console.log(error);
    return ctx.unauthorized("Invalid or expired token.");
  }
};
