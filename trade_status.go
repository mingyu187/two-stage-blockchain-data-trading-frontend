package main

import (
	"fmt"

	"dataTrading/mycontract"
	"dataTrading/utils"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

// GetTradeStatus 查询智能合约当前交易状态
func GetTradeStatus() (uint8, error) {
	// 读取配置
	utils.LoadConfig("./config.yaml")

	nodeURL := utils.ConfigString("node.url")
	contractAddress := utils.ConfigString("contract.address")

	// 连接区块链节点
	conn, err := ethclient.Dial(nodeURL)
	if err != nil {
		return 0, fmt.Errorf("连接区块链节点失败: %w", err)
	}
	defer conn.Close()

	// 创建智能合约实例
	contract, err := mycontract.NewTrading(
		common.HexToAddress(contractAddress),
		conn,
	)
	if err != nil {
		return 0, fmt.Errorf("创建智能合约实例失败: %w", err)
	}

	// 查询智能合约 State
	state, err := contract.State(nil)
	if err != nil {
		return 0, fmt.Errorf("查询智能合约状态失败: %w", err)
	}

	return state, nil
}
