// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract BeatWave is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ERC20Upgradeable
{
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
    /*
    version 4 update private
    */
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
    event TransferBeat(uint id, address indexed from, address indexed to);

    //To UUPS
    address public admin;
    modifier onlyAdmin() {
        require(msg.sender == admin, "you are not admin");
        _;
    }

    function _authorizeUpgrade(
        address newImplement
    ) internal override onlyAdmin {}

    function initialize(address _admin) external initializer {
        __ERC20_init("Beatwave", "BW");
        __Ownable_init(_admin);
        admin = _admin;
        _mint(_admin, 1000000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }

    //Kiểm tra người gọi có phải là chủ sở hữu beat không
    modifier onlyOwnerBeat(uint256 id) {
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
    function uploadBeat(string memory _cid, string memory _title) public {
        beatCountId++;
        beats[beatCountId] = Beat({
            owner: msg.sender,
            cid: _cid,
            title: _title,
            price: 0,
            isForSale: false,
            uploadTimestamp: block.timestamp,
            numberOfLikes: 0
        });

        emit BeatUpLoaded(beatCountId, msg.sender, _cid, _title, 0);
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
    ) public onlyOwnerBeat(_id) {
        beats[_id].isForSale = true;
        beats[_id].price = _price;
        emit BeatListForSale(_id, msg.sender, _price);
    }

    /*
    Người bán không muốn bán nữa hàm này sẽ được gọi
    Khi gọi xong trạng thái bán được gỡ
    Hệ thống sẽ cập nhật và xóa beat khỏi hệ thống bán
    */
    function deleteBeatForSale(uint _id) public onlyOwnerBeat(_id) {
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
    function buyBeat(uint256 amount, uint256 _id) public isSale(_id) {
        require(beats[_id].price == amount, "Incorrect Price");

        address owner = beats[_id].owner;

        // Người mua cần phê duyệt cho hợp đồng này sử dụng token của họ trước khi gọi hàm này
        transfer(owner, amount);

        beats[_id].owner = msg.sender;
        beats[_id].isForSale = false;

        emit BeatSold(_id, owner, msg.sender, amount);
    }

    /*
    Người sở hữu có thể chuyển quyên sở hữu cho bất kì ai
    */
    function transferOwner(
        uint256 _id,
        address newOwner
    ) public onlyOwnerBeat(_id) {
        address owner = beats[_id].owner;
        beats[_id].owner = newOwner;
        emit TransferBeat(_id, owner, newOwner);
    }

    /** Version 2 **/

    /*
     * Hàm thay đổi title của beat
     */
    function changeTitle(
        uint256 _id,
        string memory newTitle
    ) public onlyOwnerBeat(_id) {
        beats[_id].title = newTitle;
    }

    /*
    Donate for owner
    */
    function donateForOwner(uint256 _id, uint256 amount) public {
        address owner = beats[_id].owner;
        transfer(owner, amount);
    }

    // #version 4
    /*
    delete beat of owner or admin
    */
    function deleteBeat(uint _id) public onlyOwnerBeat(_id) {
        beats[_id].cid = "";
        beats[_id].title = "";
        beats[_id].isForSale = false;
        beats[_id].owner = address(0);
    }

    /*
    function to burn beat id for admin 
    */
    function burnBeats(uint _id) public onlyAdmin {
        beats[_id].cid = "";
        beats[_id].title = "";
        beats[_id].isForSale = false;
        beats[_id].owner = address(0);
    }
}
