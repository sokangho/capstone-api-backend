import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
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
import {Applicationuser} from '../models';
import {ApplicationuserRepository} from '../repositories';
import {compareAccountId} from '../services/authorizer.service';

@authenticate('jwt')
export class ApplicationuserController {
  constructor(
    @repository(ApplicationuserRepository)
    public applicationuserRepository: ApplicationuserRepository,
  ) {}

  // Create an application user
  @post('/applicationusers', {
    responses: {
      '200': {
        description: 'Applicationuser model instance',
        content: {
          'application/json': {schema: getModelSchemaRef(Applicationuser)},
        },
      },
    },
  })
  @authorize({allowedRoles: ['admin', 'user'], voters: [compareAccountId]})
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Applicationuser, {
            title: 'NewApplicationuser',
          }),
        },
      },
    })
    applicationuser: Applicationuser,
  ): Promise<Applicationuser> {
    return this.applicationuserRepository.create(applicationuser);
  }

  // Get all application users
  @get('/applicationusers', {
    responses: {
      '200': {
        description: 'Array of Applicationuser model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Applicationuser, {
                includeRelations: true,
              }),
            },
          },
        },
      },
    },
  })
  @authorize({allowedRoles: ['admin'], voters: [compareAccountId]})
  async find(
    @param.filter(Applicationuser) filter?: Filter<Applicationuser>,
  ): Promise<Applicationuser[]> {
    return this.applicationuserRepository.find(filter);
  }

  //Get an application user by application user id
  @get('/applicationusers/{id}', {
    responses: {
      '200': {
        description: 'Applicationuser model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Applicationuser, {
              includeRelations: true,
            }),
          },
        },
      },
    },
  })
  @authorize({allowedRoles: ['admin', 'user'], voters: [compareAccountId]})
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Applicationuser, {exclude: 'where'})
    filter?: FilterExcludingWhere<Applicationuser>,
  ): Promise<Applicationuser> {
    return this.applicationuserRepository.findById(id, filter);
  }

  // Partial update application user by application user id
  @patch('/applicationusers/{id}', {
    responses: {
      '204': {
        description: 'Applicationuser PATCH success',
      },
    },
  })
  @authorize({allowedRoles: ['admin', 'user'], voters: [compareAccountId]})
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Applicationuser, {partial: true}),
        },
      },
    })
    applicationuser: Applicationuser,
  ): Promise<void> {
    await this.applicationuserRepository.updateById(id, applicationuser);
  }

  // Delete application user by application user id
  @del('/applicationusers/{id}', {
    responses: {
      '204': {
        description: 'Applicationuser DELETE success',
      },
    },
  })
  @authorize({allowedRoles: ['admin', 'user'], voters: [compareAccountId]})
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.applicationuserRepository.deleteById(id);
  }
}
