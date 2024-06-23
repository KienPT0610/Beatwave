// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol';

contract BeatWave is UUPSUpgradeable {
    //Struct lưu thông tin beat
    struct Beat {
        address owner; //Người sở hữu
        string cid; //cid trên IPFS
        string title; //tiêu đề beat
        uint256 price; //giá bán
        bool isForSale; //trạng thái bán
        uint256 uploadTimestamp; //thời gian upload
        uint256 numberOfLikes; //số lượng lượt thích
    }

    //Để tính số ID của beat
    uint256 public beatCountId;

    //Mỗi ID sẽ ánh xạ tới 1 beat
    mapping(uint256 => Beat) public beats;

    /*
    Sự kiện upload beat lên hệ thống với số id,
    owner: người upload lên
    cid: mã CID trên IPFS của beat
    title: tiêu đề của beat
    price: giá beat
    */
    event BeatUpLoaded(
        uint256 id,
        address indexed owner,
        string cid,
        string title,
        uint256 price
    );

    /*
    Sự kiện thông báo đăng bán beat trên hệ thống
    id: mã id của beat đăng bán
    owner: người đăng bán
    price: giá bán
    */
    event BeatListForSale(uint id, address indexed owner, uint256 price);

    /*
    Sự kiện thông báo giao dịch mua beat thành công
    id: mã id beat mua
    from: người sở hữu cũ
    to: người sở hữu mới
    value: số tiền mua
    */
    event BeatSold(
        uint256 id,
        address indexed from,
        address indexed to,
        uint256 value
    );

    /*
    Sự kiện chuyển giao quyền sở hữu (không phải mua bán)
    id: mã chuyển giao
    from: người sở hữu cũ
    to: người sở hữu mới
    */
    event Transfer(uint id, address indexed from, address indexed to);

    //To UUPS
    address public admin;
    modifier onlyAdmin() {
        require(msg.sender == admin, "you are not admin");
        _;
    }

    function _authorizeUpgrade(
        address newImplement
    ) internal override onlyAdmin {}

    function initialize(address _admin) public {
        admin = _admin;
    } 

    //Kiểm tra người gọi có phải là chủ sở hữu beat không
    modifier onlyOwner(uint256 id) {
        require(
            beats[id].owner == msg.sender,
            "You are not the owner of this beat"
        );
        _;
    }

    //Kiếm tra xem có đang bán không
    modifier isSale(uint256 id) {
        require(beats[id].isForSale, "This beat is not for sale");
        _;
    }

    /*
    Hàm được gọi khi người dùng upload file lên hệ thống
    cid: sẽ được lấy từ trên IPFS trả vể
    title: tiêu đề của beat
    price: giá
    Khi gọi xong thì beat sẽ được thêm vào hệ thống beat cá nhân
    */
    function uploadBeat(
        string memory _cid,
        string memory _title,
        uint256 _price
    ) public {
        beatCountId++;
        beats[beatCountId] = Beat({
            owner: msg.sender,
            cid: _cid,
            title: _title,
            price: _price,
            isForSale: false,
            uploadTimestamp: block.timestamp,
            numberOfLikes: 0
        });

        emit BeatUpLoaded(beatCountId, msg.sender, _cid, _title, _price);
    }

    /*
    Hàm được gọi khi người dùng chọn để bán
    id được lấy từ hệ thống
    price được lấy từ hệ thống
    Khi gọi xong thì beat sẽ được thêm vào hệ thống bán 
    */
    function listBeatForSale(
        uint256 _id,
        uint256 _price
    ) public onlyOwner(_id) {
        beats[_id].isForSale = true;
        beats[_id].price = _price;
        emit BeatListForSale(_id, msg.sender, _price);
    }

    /*
    Người bán không muốn bán nữa hàm này sẽ được gọi
    Khi gọi xong trạng thái bán được gỡ
    Hệ thống sẽ cập nhật và xóa beat khỏi hệ thống bán
    */
    function deleteBeatForSale(uint _id) public onlyOwner(_id) {
        beats[_id].isForSale = false;
    }

    /*
    Hàm được gọi khi người dùng bấm like beat
    Nếu người dùng chưa like thì numberOfLikes + 1
    Nếu người dùng đã like thì sẽ thảnh bỏ like - 1
    */
    function likeBeat(uint256 _id, bool statusLiked) public isSale(_id) {
        if (!statusLiked) {
            beats[_id].numberOfLikes += 1;
        } else {
            beats[_id].numberOfLikes -= 1;
        }
    }

    /*
    Hàm được gọi khi người mua bấm vào mua beat
    id được lấy từ hệ thống
    chuyển tiền cho người bán
    chuyển quyền sở hữu cho người mua
    đánh trạng thái đang bán thành false
    */
    function buyBeat(uint256 _id) public payable isSale(_id) {
        require(beats[_id].price == msg.value, "Incorrect Price");

        address payable owner = payable(beats[_id].owner);

        owner.transfer(msg.value);

        beats[_id].owner = msg.sender;
        beats[_id].isForSale = false;

        emit BeatSold(_id, owner, msg.sender, msg.value);
    }

    /*
    Người sở hữu có thể chuyển quyên sở hữu cho bất kì ai
    */
    function transferOwner(
        uint256 _id,
        address newOwner
    ) public onlyOwner(_id) {
        address owner = beats[_id].owner;
        beats[_id].owner = newOwner;
        emit Transfer(_id, owner, newOwner);
    }
}
