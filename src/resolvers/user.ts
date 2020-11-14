import { MyContext } from 'src/types';
import { Arg, Ctx, Field, InputType, Query, Resolver, Mutation, ObjectType } from 'type-graphql';
import { User } from '../entities/User';
import argon2 from 'argon2';


@InputType()
export class UsernamePasswordInput {
  @Field()
  username: string
  @Field()
  password: string
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[];

  @Field(() => User, {nullable: true})
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(
    @Ctx() { em, req}: MyContext
  ) {
      if (!req.session.userId) {
        // user not logged in
        return null;
      }
    
    const user = await em.findOne(User, { id: req.session.userId })
    return user;
    }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() {em, req }: MyContext
  ): Promise<UserResponse> {

    if (options.username.length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "Must be atleast 3 characters long."
          }
        ]
      }
    }

    if (options.password.length <= 2) {
      return {
        errors: [
          {
            field: "password",
            message: "Password must be atleast 3 characters long."
          }
        ]
      }
    }

    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });
    try {
      await em.persistAndFlush(user);
    } catch (err) {
      if (err.code === "23505") {
        return {
          errors: [{
            field: "Username",
            message: "username is already taken."
          }]
        }
      }

      return {
        errors: [
          {
            field: err.code,
            message: err.message
          }
        ]
      }
    }

    // store user id session
    // this will set a cookie on the user and keep them logged in.
    req.session.userId = user.id;
    return { user };
    
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() {em, req}: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });
    if (!user) {
      return {
        errors: [{
          field: "username",
          message: "username doesn't exist",
        }]
      }
    }
    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password"
          }
        ]
      }
    }

    req.session!.userId = user.id;
    return {
      user
    }
  }
}