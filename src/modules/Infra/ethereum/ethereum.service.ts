import { Injectable, Logger } from '@nestjs/common';
import { EthereumNetworkType, InfuraProject, ProviderOptions } from './interface';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';

@Injectable()
export default class EthereumService {
  public ether: ethers.providers.BaseProvider;
  private readonly logger = new Logger(EthereumService.name);

  constructor(private configService: ConfigService) {
    const network: ethers.providers.Networkish = this.configService.get('ethereum_network');

    const projectSecret: string = this.configService.get('infura.project_secret');
    const projectId: string = this.configService.get('infura.project_id');

    const alchemyToken: string = this.configService.get('alchemy_token')
    
    if (!(projectSecret && projectId) && !alchemyToken) {
      throw new Error('Infura project id and secret or alchemy token is not defined');
    }
        
    const opts: ProviderOptions = {
      quorum: 1,
      alchemy: alchemyToken || '',
      infura: {projectId, projectSecret}
    }
    
    const ethersProvider = ethers.getDefaultProvider(network, opts);
    this.ether = ethersProvider;
  }

  getEther() {
    return this.ether;
  }
}
