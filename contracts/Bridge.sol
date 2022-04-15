pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./MyERC20.sol";

contract Bridge {
    using ECDSA for bytes32;

    //нужно хранить публичный ключ от закрытого ключа бэкенд сервиса
    address private validator;
    mapping(bytes32 => bool) private isRedeem;

    constructor(address _validator) {
        validator = _validator;
    }

    event SwapInitialized(
        address indexed token,
        uint256 amount,
        address indexed from,
        address indexed to,
        string toNetwork,
        string fromNetwork,
        uint256 nonce
    );

    event Redeemed(
        address indexed token,
        uint256 amount,
        string fromNetwork,
        string toNetwork,
        bytes32 hash
    );

    //токены сжигаются, запускается ивент(количество токенов, от кого, на какой адрес отправляется, из какой сети, в какую сеть)
    function swap(address token, address to, uint256 amount, string memory fromNetwork, string memory toNetwork, uint256 nonce) public {
        MyERC20 myERC20 = MyERC20(token);
        myERC20.burn(msg.sender, amount);
        emit SwapInitialized(token, amount, msg.sender, to, fromNetwork, toNetwork, nonce);
    }

    //второй пользователь запрашивает у сервера подпись и параметры отправки

    //подпись, параметры отправки, сигнатура, параметры хешируются в одно сообщение,
    //затем вызывается функция recover(функция по хешированному сообщению и по сигнатуре восстанавнивает публичный адрес, того кто подписал
    //и если подпись была выполнена бэкэндом, то пользователю минтятся токены
    //нельзя чтобы функция много раз выполнялась, нужно создать маппинг(хешированное сообщение  => true|| false)
    function redeem(
        address token,
        uint256 amount,
        string memory fromNetwork,
        string memory toNetwork,
        uint256 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        bytes32 hash = keccak256(abi.encodePacked(token, amount, fromNetwork, toNetwork, nonce));

        require(!isRedeem[hash], "Bridge: error redeem again");

        address signer = ECDSA.recover(hash.toEthSignedMessageHash(), v, r, s);
        require(signer == validator, "Bridge: signer not equal validator");
        MyERC20 myERC20 = MyERC20(token);
        myERC20.mint(msg.sender, amount);
        isRedeem[hash] = true;
        emit Redeemed(token, amount, fromNetwork, toNetwork, hash);
    }
}
