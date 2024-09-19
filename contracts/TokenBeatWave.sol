// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract TokenBeatWave is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    function initialize() public onlyInitializing {
        __ERC20_init("Beatwave", "BW");
        __Ownable_init(msg.sender);
        _mint(msg.sender, 1000000*10**18); 
    }   
  
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }
}