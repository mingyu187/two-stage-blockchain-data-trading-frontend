package main

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"

	"dataTrading/mycontract"
	"dataTrading/utils"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

func webChain() (
	*ethclient.Client,
	*mycontract.Trading,
	string,
	string,
	*ecdsa.PrivateKey,
	*ecdsa.PrivateKey,
	error,
) {
	utils.LoadConfig("./config.yaml")

	nodeURL := utils.ConfigString("node.url")
	contractAddress := utils.ConfigString("contract.address")

	sellerAddress := utils.ConfigString("seller.address")
	buyerAddress := utils.ConfigString("buyer.address")

	sellerPrivateKey, err := crypto.HexToECDSA(
		utils.ConfigString("seller.privatekey"),
	)
	if err != nil {
		return nil, nil, "", "", nil, nil,
			fmt.Errorf("读取卖家私钥失败: %w", err)
	}

	buyerPrivateKey, err := crypto.HexToECDSA(
		utils.ConfigString("buyer.privatekey"),
	)
	if err != nil {
		return nil, nil, "", "", nil, nil,
			fmt.Errorf("读取买家私钥失败: %w", err)
	}

	conn, err := ethclient.Dial(nodeURL)
	if err != nil {
		return nil, nil, "", "", nil, nil,
			fmt.Errorf("连接区块链节点失败: %w", err)
	}

	contract, err := mycontract.NewTrading(
		common.HexToAddress(contractAddress),
		conn,
	)
	if err != nil {
		conn.Close()

		return nil, nil, "", "", nil, nil,
			fmt.Errorf("创建智能合约实例失败: %w", err)
	}

	return conn,
		contract,
		sellerAddress,
		buyerAddress,
		sellerPrivateKey,
		buyerPrivateKey,
		nil
}

// WebChallenge
//
// 这里把原项目的：
//
// TestPreChallenge
// +
// TestChallenge
//
// 合并成前端的一个“发起挑战”动作。
func WebChallenge() (string, error) {
	// ==========================================
	// 1. PreChallenge
	// ==========================================

	outencKeyMap, err := utils.ScanDir(webOutEncKey)
	if err != nil {
		return "", fmt.Errorf("读取加密密钥失败: %w", err)
	}

	outFileMap, err := utils.ScanDir(webOutFile)
	if err != nil {
		return "", fmt.Errorf("读取加密数据失败: %w", err)
	}

	utils.Createfile2Buyer(
		outencKeyMap,
		outFileMap,
		webFile2Buyer,
	)

	// ==========================================
	// 2. Buyer 检查收到的数据
	// ==========================================

	webDataTree = utils.CheckDelta1(webFile2Buyer)

	if webDataTree == nil {
		return "", fmt.Errorf("CheckDelta1 未生成 Merkle Tree")
	}

	// ==========================================
	// 3. 生成 Kc
	// ==========================================

	Kc := crypto.Keccak256([]byte("random"))

	var Kc32 [32]byte
	copy(Kc32[:], Kc)

	// ==========================================
	// 4. 连接区块链
	// ==========================================

	conn,
		contract,
		_,
		buyerAddress,
		_,
		buyerPrivateKey,
		err := webChain()

	if err != nil {
		return "", err
	}

	defer conn.Close()

	// ==========================================
	// 5. Buyer 创建交易授权
	// ==========================================

	auth := utils.NewAuth(
		conn,
		buyerAddress,
		buyerPrivateKey,
	)

	// 原协议：
	// p  = 1000
	// p1 = 100
	//
	// Solidity 中明确要求：
	// msg.value == p1
	//
	// 因此这里实际支付 100。
	auth.Value = big.NewInt(100)

	tx, err := contract.Challenge(
		auth,
		Kc32,
		big.NewInt(1000),
		big.NewInt(100),
	)

	if err != nil {
		return "", fmt.Errorf(
			"发送 Challenge 交易失败: %w",
			err,
		)
	}

	receipt, err := bind.WaitMined(
		context.Background(),
		conn,
		tx,
	)

	if err != nil {
		return "", fmt.Errorf(
			"等待 Challenge 交易确认失败: %w",
			err,
		)
	}

	if receipt.Status != 1 {
		return "", fmt.Errorf(
			"Challenge 已上链，但 Solidity 执行失败，tx=%s",
			tx.Hash().Hex(),
		)
	}

	return tx.Hash().Hex(), nil
}

// WebResponse
//
// 对应原项目 TestResponse。
func WebResponse() (string, error) {
	// ==========================================
	// 1. 生成 sample Merkle Tree
	// ==========================================

	webSampleTree = utils.CommitSampleKeys(
		webOutEncKey,
		webChallengeLength,
	)

	if webSampleTree == nil {
		return "", fmt.Errorf(
			"CommitSampleKeys 未生成 sample Merkle Tree",
		)
	}

	// ==========================================
	// 2. 连接区块链
	// ==========================================

	conn,
		contract,
		sellerAddress,
		_,
		sellerPrivateKey,
		_,
		err := webChain()

	if err != nil {
		return "", err
	}

	defer conn.Close()

	// ==========================================
	// 3. Seller 授权
	// ==========================================

	auth := utils.NewAuth(
		conn,
		sellerAddress,
		sellerPrivateKey,
	)

	var hash32 [32]byte

	copy(
		hash32[:],
		webSampleTree.RootNode.Hash,
	)

	// ==========================================
	// 4. Response 上链
	// ==========================================

	tx, err := contract.Response(
		auth,
		hash32,
		big.NewInt(10001),
	)

	if err != nil {
		return "", fmt.Errorf(
			"发送 Response 交易失败: %w",
			err,
		)
	}

	receipt, err := bind.WaitMined(
		context.Background(),
		conn,
		tx,
	)

	if err != nil {
		return "", fmt.Errorf(
			"等待 Response 交易确认失败: %w",
			err,
		)
	}

	if receipt.Status != 1 {
		return "", fmt.Errorf(
			"Response 已上链，但 Solidity 执行失败，tx=%s",
			tx.Hash().Hex(),
		)
	}

	return tx.Hash().Hex(), nil
}

// WebCheckSample
//
// 对应原项目 TestPayleft 中的 CheckSample 部分。
// 注意：这里暂时只执行真实 CheckSample，
// 不在这一步付款。
func WebCheckSample() error {
	key2Map, err := utils.ScanDir(webKey2sDir)
	if err != nil {
		return fmt.Errorf(
			"读取 sample key 失败: %w",
			err,
		)
	}

	encKeyMap, err := utils.ScanDir(webOutEncKey)
	if err != nil {
		return fmt.Errorf(
			"读取加密 key 失败: %w",
			err,
		)
	}

	encDataMap, err := utils.ScanDir(webOutFile)
	if err != nil {
		return fmt.Errorf(
			"读取加密数据失败: %w",
			err,
		)
	}

	if len(key2Map) == 0 {
		return fmt.Errorf("没有可检查的 sample key")
	}

	// 原项目这里写死 1530。
	// Demo 数据只有 5 份，因此传入实际数量更合理。
	utils.CheckSample(
		key2Map,
		encKeyMap,
		encDataMap,
		len(key2Map),
	)

	return nil
}

// WebPayleft
//
// 对应原项目 TestPayleft 的 Payleft 部分。
func WebPayleft() (string, error) {
	// 先真实执行 CheckSample
	err := WebCheckSample()
	if err != nil {
		return "", err
	}

	conn,
		contract,
		_,
		buyerAddress,
		_,
		buyerPrivateKey,
		err := webChain()

	if err != nil {
		return "", err
	}

	defer conn.Close()

	auth := utils.NewAuth(
		conn,
		buyerAddress,
		buyerPrivateKey,
	)

	// 剩余款项：900
	auth.Value = big.NewInt(900)

	tx, err := contract.Payleft(auth)

	if err != nil {
		return "", fmt.Errorf(
			"发送 Payleft 交易失败: %w",
			err,
		)
	}

	receipt, err := bind.WaitMined(
		context.Background(),
		conn,
		tx,
	)

	if err != nil {
		return "", fmt.Errorf(
			"等待 Payleft 交易确认失败: %w",
			err,
		)
	}

	if receipt.Status != 1 {
		return "", fmt.Errorf(
			"Payleft 已上链，但 Solidity 执行失败，tx=%s",
			tx.Hash().Hex(),
		)
	}

	return tx.Hash().Hex(), nil
}

// WebReleaseMasterkey
//
// 对应原项目 TestReleaseMasterkey。
func WebReleaseMasterkey() (string, error) {
	conn,
		contract,
		sellerAddress,
		_,
		sellerPrivateKey,
		_,
		err := webChain()

	if err != nil {
		return "", err
	}

	defer conn.Close()

	auth := utils.NewAuth(
		conn,
		sellerAddress,
		sellerPrivateKey,
	)

	var hash32 [32]byte

	copy(
		hash32[:],
		webMasterK2,
	)

	tx, err := contract.ReleaseMasterkey(
		auth,
		hash32,
	)

	if err != nil {
		return "", fmt.Errorf(
			"发送 ReleaseMasterkey 交易失败: %w",
			err,
		)
	}

	receipt, err := bind.WaitMined(
		context.Background(),
		conn,
		tx,
	)

	if err != nil {
		return "", fmt.Errorf(
			"等待 ReleaseMasterkey 交易确认失败: %w",
			err,
		)
	}

	if receipt.Status != 1 {
		return "", fmt.Errorf(
			"ReleaseMasterkey 已上链，但 Solidity 执行失败，tx=%s",
			tx.Hash().Hex(),
		)
	}

	return tx.Hash().Hex(), nil
}
