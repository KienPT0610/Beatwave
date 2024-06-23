// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BeatWave {

    //Struct lưu thông tin beat
    struct Beat {
        address owner;                  //Người sở hữu
        string cid;                     //cid trên IPFS 
        string title;                   //tiêu đề beat  
        uint256 price;                  //giá bán
        bool isForSale;                 //trạng thái bán
        uint256 uploadTimestamp;        //thời gian upload  
        uint256 numberOfLikes;          //số lượng lượt thích
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
    event BeatUpLoaded(uint256 id, address indexed owner, string cid, string title, uint256 price);

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
    event BeatSold(uint256 id, address indexed from, address indexed to, uint256 value);

    /*
    Sự kiện chuyển giao quyền sở hữu (không phải mua bán)
    id: mã chuyển giao
    from: người sở hữu cũ
    to: người sở hữu mới
    */
    event Transfer(uint id, address indexed from, address indexed to);

    //Kiểm tra người gọi có phải là chủ sở hữu beat không
    modifier onlyOwner(uint256 id) {
        require(beats[id].owner == msg.sender, "You are not the owner of this beat");
        _;
    }

    function uploadBeat(string memory _cid, string memory _title, uint256 _price) public {
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


    function listBeatForSale(uint256 _id, uint256 _price) public onlyOwner(_id){
        beats[_id].isForSale = true;
        beats[_id].price = _price;
        emit BeatListForSale(_id, msg.sender, _price);
    }

    function likeBeat(uint256 _id) public {
        beats[_id].numberOfLikes += 1;
    }


    function buyBeat(uint256 _id) public payable {
        require(beats[_id].isForSale, "This beat is not for sale");
        require(beats[_id].price == msg.value, "Incorrect Price");

        address payable owner = payable(beats[_id].owner);

        owner.transfer(msg.value);

        beats[_id].owner = msg.sender;
        beats[_id].isForSale = false;
        
        emit BeatSold(_id, owner, msg.sender, msg.value);
    }

    function transferOwner(uint256 _id, address newOwner) public {
        address owner = beats[_id].owner;
        beats[_id].owner = newOwner;
        emit Transfer(_id, owner, newOwner);
    }
}