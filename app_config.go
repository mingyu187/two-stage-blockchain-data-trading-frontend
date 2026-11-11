package main

import (
	merkleTree "dataTrading/merkle"

	"github.com/ethereum/go-ethereum/crypto"
)

// 网页后端使用的数据交易配置
var (
	// 原始待交易数据：上传的 ZIP 或图片打包后的 ZIP
	webInFile = "./encTest/DemoSelfDrivingCar.zip"

	// 网页上传文件的临时保存目录
	webUploadDir = "./encTest/uploads/"

	// 当前上传数据的信息
	webDatasetName  string
	webDatasetSize  int64
	webDatasetCount int
	webOutFile      = "./encTest/demo-output/"
	webOutKey       = "./encTest/demo-keys/"
	webOutEncKey    = "./encTest/demo-enckeys/"
	webKey2sDir     = "./encTest/demo-key2s/"

	// 买方最终接收到的数据
	webFile2Buyer = "./encTest/file2Buyer/"

	// 第一阶段主密钥
	webMasterK1 = crypto.Keccak256([]byte("123"))

	// 第二阶段主密钥
	webMasterK2 = crypto.Keccak256([]byte("321"))

	// 数据 Merkle Tree
	webDataTree *merkleTree.MerkleTree

	// Sample Keys Merkle Tree
	webSampleTree *merkleTree.MerkleTree

	// Challenge 的采样数量
	webChallengeLength = 89
)
