import {authenticate, UserService} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import * as bcrypt from 'bcrypt';
import {AccountServiceBindings, JWTServiceBindings} from '../keys';
import {Account, AccountDto, Credentials} from '../models';
import {AccountRepository} from '../repositories';
import {JwtService} from '../services';

@authenticate('jwt')
export class AccountController {
  constructor(
    @repository(AccountRepository)
    public accountRepository: AccountRepository,
    @inject(AccountServiceBindings.ACCOUNT_SERVICE)
    public accountService: UserService<Account, Credentials>,
    @inject(JWTServiceBindings.JWT_SERVICE)
    public jwtService: JwtService,
  ) {}

  // Use for hashing password
  saltRounds = 10;

  // Register account
  @post('/accounts/register', {
    responses: {
      '200': {
        description: 'Register successful',
        content: {'application/json': {schema: getModelSchemaRef(Account)}},
      },
    },
  })
  @authenticate.skip()
  async register(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Account, {
            title: 'NewAccount',
          }),
        },
      },
    })
    account: AccountDto,
  ): Promise<Account> {
    // Hash password
    account.password = bcrypt.hashSync(account.password, this.saltRounds);
    return this.accountRepository.create(account);
  }

  // Login account
  @post('/accounts/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                userProfile: {
                  type: 'object',
                },
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  @authenticate.skip()
  async login(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              username: {
                type: 'string',
              },
              password: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    credentials: Credentials,
  ): Promise<object> {
    // Verify account exists and password is correct
    const account = await this.accountService.verifyCredentials(credentials);

    // Convert to UserProfile object (contains only id and username properties)
    const userProfile = this.accountService.convertToUserProfile(account);

    // Create a JWT
    const token = await this.jwtService.generateToken(userProfile);

    return {
      userProfile,
      token,
    };
  }

  // Get all accounts
  @get('/accounts', {
    responses: {
      '200': {
        description: 'Array of Account model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Account, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authorize({allowedRoles: ['admin']})
  async find(
    @param.filter(Account) filter?: Filter<Account>,
  ): Promise<Account[]> {
    return this.accountRepository.find(filter);
  }

  // Get an account by account id
  @get('/accounts/{id}', {
    responses: {
      '200': {
        description: 'Account model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Account, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authorize({allowedRoles: ['admin', 'user']})
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Account, {exclude: 'where'})
    filter?: FilterExcludingWhere<Account>,
  ): Promise<Account> {
    return this.accountRepository.findById(id, filter);
  }

  // Partial update an account by account id
  @patch('/accounts/{id}', {
    responses: {
      '204': {
        description: 'Account PATCH success',
      },
    },
  })
  @authorize({allowedRoles: ['admin', 'user']})
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Account, {partial: true}),
        },
      },
    })
    account: AccountDto,
  ): Promise<void> {
    console.log(account);
    // If password is being updated
    if (account.password) {
      // Hash password
      account.password = bcrypt.hashSync(account.password, this.saltRounds);
    }

    await this.accountRepository.updateById(id, account);
  }

  // Delete an account by account id
  @del('/accounts/{id}', {
    responses: {
      '204': {
        description: 'Account DELETE success',
      },
    },
  })
  @authorize({allowedRoles: ['admin', 'user']})
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.accountRepository.deleteById(id);
  }
}
