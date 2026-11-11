import { useEffect, useState } from "react";
import "./App.css";

const demoImages = [
  "/demo/car_01.jpg",
  "/demo/car_02.jpg",
  "/demo/car_03.jpg",
  "/demo/car_04.jpg",
  "/demo/car_05.jpg",
];

function App() {
  const [page, setPage] = useState("home");

  // 卖家交易状态
  const [preparationStatus, setPreparationStatus] =
    useState("idle");

  const [commitDataStatus, setCommitDataStatus] =
    useState("idle");

  // 买家交易阶段
  const [buyerStage, setBuyerStage] = useState(0);

  if (page === "seller") {
    return (
      <SellerConsole
  onHome={() => setPage("home")}
  onBuyer={() => setPage("buyer")}
  preparationStatus={preparationStatus}
  setPreparationStatus={setPreparationStatus}
  commitDataStatus={commitDataStatus}
  setCommitDataStatus={setCommitDataStatus}
/>
    );
  }

  if (page === "buyer") {
    return (
      <BuyerConsole
        onHome={() => setPage("home")}
        onSeller={() => setPage("seller")}
        buyerStage={buyerStage}
        setBuyerStage={setBuyerStage}
      />
    );
  }

  return (
    <HomePage
      onSeller={() => setPage("seller")}
      onBuyer={() => setPage("buyer")}
    />
  );
}

/* =========================================================
   首页
========================================================= */

function HomePage({ onSeller, onBuyer }) {
  return (
    <div className="home-page">
      <header className="home-header">
        <div className="brand-block">
          <div className="brand-icon">⚯</div>

          <div>
            <div className="brand-title">DATA TRADE</div>
            <div className="brand-subtitle">BLOCKCHAIN SYSTEM</div>
          </div>
        </div>

        <div className="network-badge">
          <span className="status-dot"></span>
          Anvil Local
        </div>
      </header>

      <main className="home-main">
        <div className="hero-label">BLOCKCHAIN DATA TRADING</div>

        <h1>
          基于区块链的
          <br />
          公平数据交易系统
        </h1>

        <p className="hero-description">
          Two-stage blockchain-based fair data trading platform
        </p>

        <div className="role-grid">
          <button className="role-card" onClick={onSeller}>
            <div className="role-icon">SELLER</div>

            <div className="role-content">
              <div className="role-label">SELLER</div>
              <h2>卖家控制台</h2>
              <p>管理数据集、准备数据并发起数据交易</p>
            </div>

            <div className="role-arrow">→</div>
          </button>

          <div className="blockchain-center">
            <div className="blockchain-icon">⚯</div>
            <div className="blockchain-title">BLOCKCHAIN</div>
            <div className="blockchain-network">
              Anvil Local Network
            </div>
          </div>

          <button className="role-card" onClick={onBuyer}>
            <div className="role-icon buyer-icon">BUYER</div>

            <div className="role-content">
              <div className="role-label">BUYER</div>
              <h2>买家控制台</h2>
              <p>查看数据、参与挑战并完成数据交易</p>
            </div>

            <div className="role-arrow">→</div>
          </button>
        </div>

        <div className="home-process">
          <div className="section-eyebrow">TRADING PROCESS</div>
          <h2>数据交易流程</h2>

          <div className="process-grid">
            <div className="process-item">
              <span>01</span>
              <strong>数据准备</strong>
            </div>

            <div className="process-item">
              <span>02</span>
              <strong>提交数据承诺</strong>
            </div>

            <div className="process-item">
              <span>03</span>
              <strong>挑战与验证</strong>
            </div>

            <div className="process-item">
              <span>04</span>
              <strong>释放主密钥</strong>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   卖家控制台
========================================================= */

export function SellerConsole({
  onHome,
  onBuyer,
  preparationStatus,
  setPreparationStatus,
  commitDataStatus,
  setCommitDataStatus,
}) {

  
const [datasetInfo, setDatasetInfo] = useState({
  uploaded: false,
  name: "",
  size: 0,
  fileCount: 0,
});

const [uploading, setUploading] = useState(false);
const [uploadMessage, setUploadMessage] = useState("");

const refreshDatasetInfo = async () => {
  try {
    const response = await fetch("http://172.23.129.203:8080/api/dataset-info");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "读取数据集信息失败");
    }

    setDatasetInfo({
      uploaded: Boolean(data.uploaded),
      name: data.name || "",
      size: Number(data.size || 0),
      fileCount: Number(data.fileCount || 0),
    });
  } catch (error) {
    console.error("读取数据集信息失败:", error);
  }
};

const handleDatasetUpload = async (event) => {
  const files = Array.from(event.target.files || []);

  if (files.length === 0) return;

  const isSingleZip =
    files.length === 1 &&
    files[0].name.toLowerCase().endsWith(".zip");

  const allowedExtensions = [
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp",
  ];

  const areImages = files.every((file) =>
    allowedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    )
  );

  if (!isSingleZip && !areImages) {
    setUploadMessage("请选择一个 ZIP 文件，或一次选择多张图片。");
    event.target.value = "";
    return;
  }

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  setUploading(true);
  setUploadMessage("正在上传，请稍候……");

  try {
    const response = await fetch(
      "http://172.23.129.203:8080/api/upload-dataset",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "上传失败");
    }

    await refreshDatasetInfo();
    setUploadMessage("上传成功，可以继续执行数据准备。");
  } catch (error) {
    console.error("数据集上传失败:", error);
    setUploadMessage(
      `上传失败：${
        error instanceof Error ? error.message : "未知错误"
      }`
    );
  } finally {
    setUploading(false);
    event.target.value = "";
  }
};


  

  const [preparationMessage, setPreparationMessage] =
    useState("");
    const [tradeState, setTradeState] = useState(null);
    const [responseStatus, setResponseStatus] = useState("idle");
    const [responseMessage, setResponseMessage] = useState("");

  const handlePreparation = async () => {
    setPreparationStatus("running");
    setPreparationMessage("正在执行数据准备，请稍候...");

    try {
      const response = await fetch(
        "http://172.23.129.203:8080/api/preparation",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "数据准备失败");
      }

      setPreparationStatus("success");
      setPreparationMessage(
        "数据准备完成，Merkle Tree 已生成"
      );
    } catch (error) {
      console.error("Preparation error:", error);

      setPreparationStatus("error");
      setPreparationMessage(
        error.message ||
          "无法连接 Go 后端，请确认 8080 端口正在运行"
      );
    }
  };
    const handleCommitData = async () => {
    setCommitDataStatus("running");

    try {
      const response = await fetch(
        "http://172.23.129.203:8080/api/commit-data",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Commit Data 执行失败"
        );
      }

      setCommitDataStatus("success");
    } catch (error) {
      console.error("Commit Data error:", error);

      setCommitDataStatus("error");
    }
  };
  
const handleResponse = async () => {
  setResponseStatus("running");
  setResponseMessage("正在提交卖家响应交易...");

  try {
    const response = await fetch(
      "http://172.23.129.203:8080/api/response",
      { method: "POST" }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Response 执行失败");
    }

    const statusResponse = await fetch(
      "http://172.23.129.203:8080/api/trade-status"
    );
    const statusData = await statusResponse.json();

    if (!statusResponse.ok || !statusData.success) {
      throw new Error("交易已提交，但无法确认最新链上状态");
    }

    setTradeState(statusData.state);

    if (statusData.state === 3) {
      setResponseStatus("success");
      setResponseMessage("卖家响应已上链，当前 State = 3");
    } else {
      setResponseStatus("error");
      setResponseMessage(
        `交易请求已返回成功，但当前链上 State = ${statusData.state}，请检查合约状态`
      );
    }
  } catch (error) {
    console.error("Response error:", error);
    setResponseStatus("error");
    setResponseMessage(error.message || "Response 执行失败");
  }
};
    // 进入 Seller 页面时，从区块链恢复真实交易状态
  useEffect(() => {
    const restoreTradeStatus = async () => {
      try {
        const response = await fetch(
          "http://172.23.129.203:8080/api/trade-status"
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "读取区块链交易状态失败"
          );
        }

        console.log("Seller 当前智能合约 State:", data.state);
        setTradeState(data.state);

        // Solidity State:
        // 0 = start
        // 1 = commitData
        // 2 = challenge
        // 3 = response
        // 4 = payleft
        // ...

        if (data.state >= 1) {
  setCommitDataStatus("success");
}
      } catch (error) {
        console.error(
          "Seller trade status restore error:",
          error
        );
      }
    };

    restoreTradeStatus();
  }, []);
  
const handleReleaseMasterkey = async () => {
  if (tradeState !== 4) {
    alert("当前链上状态不是 4，暂时不能释放主密钥。");
    return;
  }

  if (!window.confirm("确认使用卖家账户释放主密钥吗？")) {
    return;
  }

  try {
    const response = await fetch(
      "http://172.23.129.203:8080/api/release-masterkey",
      { method: "POST" }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "释放主密钥失败");
    }

    alert("释放主密钥交易已成功执行。");

    const statusResponse = await fetch(
      "http://172.23.129.203:8080/api/trade-status"
    );
    const statusData = await statusResponse.json();

    if (!statusResponse.ok || !statusData.success) {
      throw new Error("交易已提交，但读取链上状态失败");
    }

    setTradeState(statusData.state);

    if (statusData.state !== 7) {
      alert(
        `请检查链上状态，当前 State = ${statusData.state}`
      );
    }
  } catch (error) {
    console.error("Release Masterkey error:", error);
    alert(
      `释放主密钥失败：${
        error instanceof Error ? error.message : "未知错误"
      }`
    );
  }
};
useEffect(() => {
  refreshDatasetInfo();
}, []);

  // 原来的 SellerConsole 内容继续放这里
  return (
    <div className="dashboard">
      <Sidebar
        role="seller"
        onHome={onHome}
        onBuyer={onBuyer}
      />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <div className="section-eyebrow">SELLER CONSOLE</div>

            <h1>卖家控制台</h1>

            <p>管理数据集并发起公平数据交易</p>
          </div>

          <div className="connection-badge">
            <span className="status-dot"></span>
            Seller · Connected
          </div>
        </div>

        {/* 数据集信息 */}
        

{/* 数据集信息 */}
<section className="panel dataset-panel">
  <div className="panel-heading">
    <div>
      <h2>数据集</h2>
      <p>
        {datasetInfo.uploaded
          ? datasetInfo.name
          : "尚未上传数据集，请先上传 ZIP 文件或多张图片"}
      </p>
    </div>

    <span className="ready-badge">
      {datasetInfo.uploaded ? "READY" : "NO DATA"}
    </span>
  </div>

  <div className="info-grid four-columns">
    <InfoCard
      label="数据集名称"
      value={datasetInfo.uploaded ? datasetInfo.name : "尚未上传"}
    />
    <InfoCard
      label="文件数量"
      value={datasetInfo.uploaded ? `${datasetInfo.fileCount} 个文件` : "—"}
    />
    <InfoCard
      label="数据大小"
      value={
        datasetInfo.uploaded
          ? `${(datasetInfo.size / (1024 * 1024)).toFixed(2)} MB`
          : "—"
      }
    />
    <InfoCard label="网络" value="Anvil Local" />
  </div>

  <div className="upload-section">
    <div>
      <h3>上传数据集</h3>
      <p>支持单个 ZIP 文件，或多张图片</p>
    </div>

    <label className="upload-button">
      {uploading ? "正在上传..." : "上传"}
      <input
        type="file"
        accept=".zip,.png,.jpg,.jpeg,.gif,.webp,.bmp"
        multiple
        disabled={uploading}
        onChange={handleDatasetUpload}
        hidden
      />
    </label>

    {uploadMessage && <p>{uploadMessage}</p>}
  </div>
</section>



        {/* 卖家交易流程 */}
        <section className="trading-section">
          <div className="section-eyebrow">TRADING PROCESS</div>

          <h2>数据交易流程</h2>

          <p className="section-description">
            按照两阶段公平数据交易协议执行
          </p>

          <div className="step-grid">
            <SellerStep
              number="01"
              title="数据准备"
              description="加密数据、生成密钥并建立 Merkle Tree"
              buttonText="数据准备"
              active={true}
              onClick={handlePreparation}
              status={preparationStatus}
              successText="✓ 数据准备完成，Merkle Tree 已生成"
            />
          <SellerStep
  number="02"
  title="提交数据承诺"
  description="将数据承诺提交至区块链智能合约"
  buttonText="Commit Data"
  active={
  preparationStatus === "success" &&
  commitDataStatus !== "success"
}
  onClick={handleCommitData}
  status={commitDataStatus}
  successText="✓ 数据承诺已成功提交至区块链"
/>

      

            
<SellerStep
  number="03"
  title="验证卖家响应"
  description="提交响应承诺至区块链，供买家验证"
  buttonText={
    responseStatus === "success" ? "Response 已完成" : "Response"
  }
  active={tradeState === 2 && responseStatus !== "success"}
  onClick={handleResponse}
  status={responseStatus}
  successText={responseMessage}
/>

            
<SellerStep
  number="04"
  title="释放主密钥"
  description={
    tradeState === 7
      ? "主密钥已提交至区块链"
      : "完成交易后向买家释放最终密钥"
  }
  buttonText={
    tradeState === 7 ? "Release Completed" : "Release Key"
  }
  active={tradeState === 4}
  onClick={handleReleaseMasterkey}
  status={tradeState === 7 ? "success" : "idle"}
  successText={
    tradeState === 7 ? "主密钥释放成功" : ""
  }
/>
          </div>
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   买家控制台
========================================================= */

export function BuyerConsole({
  onHome,
  onSeller,
  buyerStage,
  setBuyerStage,
}) {
  const [tradeState, setTradeState] = useState(null);
  const [tradeStateLoading, setTradeStateLoading] = useState(true);
  const [tradeStateMessage, setTradeStateMessage] = useState("");
  const [sampleCheckStatus, setSampleCheckStatus] = useState("idle");
const [sampleCheckMessage, setSampleCheckMessage] = useState("");
const [payleftStatus, setPayleftStatus] = useState("idle");
const [payleftMessage, setPayleftMessage] = useState("");

  // 从 Go 后端读取智能合约当前 State
  const fetchTradeStatus = async () => {
    try {
      setTradeStateLoading(true);
      setTradeStateMessage("");

      const response = await fetch(
        "http://172.23.129.203:8080/api/trade-status"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "读取区块链交易状态失败"
        );
      }

      console.log("当前智能合约 State:", data.state);

      setTradeState(data.state);

      // Solidity State：
      // 0 = start
      // 1 = commitData
      // 2 = challenge
      // 3 = response
      // 4 = payleft
      // ...
      //
      // 买家前端阶段：
      // 0 = 等待卖家 Commit Data
      // 1 = 卖家已经 Commit Data
      //
      
if (data.state === 0) {
setBuyerStage(0);
} else if (data.state === 1) {
setBuyerStage(1);
} else if (data.state === 2) {
setBuyerStage(2);
} else if (data.state === 3) {
setBuyerStage(3);
} else {
setBuyerStage(4);
}

    } catch (error) {
      console.error("Trade status error:", error);

      setTradeStateMessage(
        error.message ||
          "无法读取区块链状态，请确认 Go 后端正在运行"
      );
    } finally {
      setTradeStateLoading(false);
    }
  };

  // 买家进入页面时，自动读取一次链上状态
  useEffect(() => {
    fetchTradeStatus();
  }, []);
  
  const handleCheckSample = async () => {
    setSampleCheckStatus("running");
    setSampleCheckMessage("正在检查挑战样本...");

    try {
      const response = await fetch(
        "http://172.23.129.203:8080/api/check-sample",
        { method: "POST" }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "样本检查失败");
      }

      setSampleCheckStatus("success");
      setSampleCheckMessage("样本检查接口执行成功");
      await fetchTradeStatus();
    } catch (error) {
      setSampleCheckStatus("error");
      setSampleCheckMessage(
        error instanceof Error ? error.message : "样本检查失败"
      );
    }
  };

  const handlePayleft = async () => {
    if (tradeState !== 3) {
      setPayleftStatus("error");
      setPayleftMessage("当前链上状态不是 3，暂不能支付尾款");
      return;
    }

    if (sampleCheckStatus !== "success") {
      setPayleftStatus("error");
      setPayleftMessage("请先成功执行样本检查");
      return;
    }

    if (!window.confirm("确认使用买家账户支付交易尾款吗？")) {
      return;
    }

    setPayleftStatus("running");
    setPayleftMessage("正在提交尾款交易...");

    try {
      const response = await fetch(
        "http://172.23.129.203:8080/api/payleft",
        { method: "POST" }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "支付尾款失败");
      }

      await fetchTradeStatus();

      setPayleftStatus("success");
      setPayleftMessage("尾款交易已执行，请核对链上状态");
    } catch (error) {
      setPayleftStatus("error");
      setPayleftMessage(
        error instanceof Error ? error.message : "支付尾款失败"
      );
    }
  };

  
  return (
    <div className="dashboard">
      <Sidebar
        role="buyer"
        onHome={onHome}
        onSeller={onSeller}
      />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <div className="section-eyebrow">BUYER CONSOLE</div>

            <h1>买家控制台</h1>

            <p>查看数据、参与挑战并完成公平数据交易</p>
          </div>

          <div className="connection-badge">
            <span className="status-dot"></span>
            Buyer · Connected
          </div>
        </div>

        <section className="panel dataset-panel">

          {/* =================================================
              买家数据区域

              注意：
              buyerStage < 2 时绝对不显示图片
              buyerStage >= 2 才显示挑战抽样图片
          ================================================= */}

          <div className="buyer-sample-section">
            <div className="sample-header">
              <div>
                <h3>
                  {buyerStage >= 2
                    ? "挑战抽样样本"
                    : "数据预览"}
                </h3>

                <p>
                  {buyerStage >= 2
                    ? "以下为本次 Challenge 的演示抽样样本"
                    : "挑战开始前，数据样本受到保护"}
                </p>
              </div>

              {buyerStage >= 2 && (
                <span className="sample-count">
                  CHALLENGE SAMPLES
                </span>
              )}
            </div>

            {/* =============================================
                Challenge 之前
            ============================================= */}

            {buyerStage < 2 && (
              <div className="locked-sample-box">
                <div className="locked-icon">🔒</div>

                <h3>数据样本暂不可查看</h3>

                {buyerStage === 0 && (
                  <p>
                    等待卖家提交数据承诺
                    <br />
                    数据承诺完成后才能发起 Challenge
                  </p>
                )}

                {buyerStage === 1 && (
                  <p>
                    卖家已提交数据承诺
                    <br />
                    请发起 Challenge 后查看抽样样本
                  </p>
                )}

                <div className="locked-status">
                  {buyerStage === 0
                    ? "WAITING FOR COMMIT"
                    : "READY FOR CHALLENGE"}
                </div>
              </div>
            )}

            {/* =============================================
                Challenge 之后
                才显示 5 张图片
            ============================================= */}

            {buyerStage >= 2 && (
              <div className="challenge-sample-area">
                <div className="challenge-success">
                  <span>✓</span>
                  Challenge 已发起，可以查看抽样样本
                </div>

                <div className="image-grid">
                  {demoImages.map((src, index) => (
                    <div className="image-card" key={src}>
                      <img
                        src={src}
                        alt={`Challenge sample ${index + 1}`}
                      />

                      <span className="image-label">
                        SAMPLE{" "}
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            买家交易状态
        ================================================= */}

        <section className="trading-section">
          <div className="section-eyebrow">
            TRADING PROCESS
          </div>

          <h2>交易状态</h2>

          <p className="section-description">
            按照两阶段公平数据交易协议参与交易
          </p>

          <div className="buyer-step-grid">

            {/* Step 01 */}
            {/* Step 01 */}
<BuyerStep
  number="01"
  title="等待数据承诺"
  description={
    tradeStateLoading
      ? "正在读取区块链交易状态..."
      : tradeStateMessage
      ? tradeStateMessage
      : tradeState === 0
      ? "等待卖家将数据承诺提交至区块链"
      : "卖家已将数据承诺提交至区块链"
  }
  status={
    tradeStateLoading
      ? "CHECKING"
      : tradeStateMessage
      ? "ERROR"
      : tradeState === 0
      ? "CURRENT"
      : "DONE"
  }
  statusType={
    tradeStateLoading
      ? "current"
      : tradeStateMessage
      ? "locked"
      : tradeState === 0
      ? "current"
      : "done"
  }
/>

            {/* Step 02 */}
           {/* Step 02 */}

<BuyerStep
  number="02"
  title="发起挑战"
  description="根据数据承诺发起随机挑战"
  status={
    buyerStage === 0
      ? "LOCKED"
      : buyerStage === 1
      ? "READY"
      : "DONE"
  }
  statusType={
    buyerStage === 0
      ? "locked"
      : buyerStage === 1
      ? "ready"
      : "done"
  }
  buttonText={
    buyerStage === 1
      ? "Challenge"
      : undefined
  }
  onClick={
    buyerStage === 1
      ? async () => {
          try {
            const response = await fetch(
  "http://172.23.129.203:8080/api/challenge",
  {
    method: "POST",
  }
);

            if (!response.ok) {
              const message = await response.text();
              throw new Error(message || "Challenge 请求失败");
            }

            // 只有后端真正完成链上 Challenge 后，才推进前端状态
            setBuyerStage(2);
          } catch (error) {
            console.error("Challenge error:", error);
            alert(
              `Challenge 失败：${
                error instanceof Error
                  ? error.message
                  : "未知错误"
              }`
            );
          }
        }
      : undefined
  }
/>

            {/* Step 03 */}
            
{/* Step 03 */}
<BuyerStep
  number="03"
  title="验证卖家响应"
  description={
    sampleCheckMessage || "检查挑战结果并验证数据完整性"
  }
  status={
    sampleCheckStatus === "running"
      ? "CHECKING"
      : sampleCheckStatus === "success"
      ? "CHECKED"
      : sampleCheckStatus === "error"
      ? "ERROR"
      : tradeState === 3
      ? "READY"
      : "WAITING"
  }
  statusType={
    sampleCheckStatus === "success"
      ? "done"
      : sampleCheckStatus === "error"
      ? "locked"
      : tradeState === 3
      ? "ready"
      : "locked"
  }
  buttonText={
    tradeState === 3 && sampleCheckStatus !== "success"
      ? sampleCheckStatus === "running"
        ? "检查中..."
        : "检查样本"
      : undefined
  }
  onClick={handleCheckSample}
/>

{/* Step 04 */}
<BuyerStep
  number="04"
  title="支付剩余款项"
  description={payleftMessage || "样本检查接口成功后，可以提交尾款交易"}
  status={
    payleftStatus === "running"
      ? "PAYING"
      : tradeState >= 4
      ? "DONE"
      : payleftStatus === "error"
      ? "ERROR"
      : sampleCheckStatus === "success" && tradeState === 3
      ? "READY"
      : "WAITING"
  }
  statusType={
    tradeState >= 4
      ? "done"
      : sampleCheckStatus === "success" && tradeState === 3
      ? "ready"
      : "locked"
  }
  buttonText={
    tradeState === 3 && sampleCheckStatus === "success"
      ? payleftStatus === "running"
        ? "支付中..."
        : "Payleft"
      : undefined
  }
  onClick={handlePayleft}
/>
          </div>
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   Sidebar
========================================================= */

function Sidebar({ role, onHome, onSeller, onBuyer }) {
  const isSeller = role === "seller";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">⚯</div>

        <div>
          <div className="sidebar-title">DATA TRADE</div>
          <div className="sidebar-subtitle">
            BLOCKCHAIN SYSTEM
          </div>
        </div>
      </div>

      <div className="sidebar-divider"></div>

      <div className="account-card">
        <div className="account-avatar">
          {isSeller ? "SELLER" : "BUYER"}
        </div>

        <div>
          <strong>
            {isSeller ? "SELLER" : "BUYER"}
          </strong>

          <span>
            {isSeller ? "卖家账户" : "买家账户"}
          </span>
        </div>
      </div>

      <div className="sidebar-section-title">
        {isSeller ? "SELLER CONSOLE" : "BUYER CONSOLE"}
      </div>

      <nav className="sidebar-nav">

        <button
          className="sidebar-nav-item active"
          onClick={() => {}}
        >
          <span>▦</span>
          <span>{isSeller ? "数据集" : "数据集"}</span>
        </button>

        {isSeller ? (
          <>
            <button
              className="sidebar-nav-item"
              onClick={() => {}}
            >
              <span>↥</span>
              <span>数据准备</span>
            </button>

            <button
              className="sidebar-nav-item"
              onClick={() => {}}
            >
              <span>◇</span>
              <span>数据承诺</span>
            </button>

            <button
              className="sidebar-nav-item"
              onClick={() => {}}
            >
              <span>◆</span>
              <span>交易状态</span>
            </button>
          </>
        ) : (
          <>
            <button
              className="sidebar-nav-item"
              onClick={() => {}}
            >
              <span>◇</span>
              <span>数据承诺</span>
            </button>

            <button
              className="sidebar-nav-item"
              onClick={() => {}}
            >
              <span>◆</span>
              <span>挑战验证</span>
            </button>

            <button
              className="sidebar-nav-item"
              onClick={() => {}}
            >
              <span>✓</span>
              <span>交易状态</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-bottom">
        <button
          className="network-card"
          onClick={onHome}
        >
          <span className="status-dot"></span>

          <div>
            <strong>Anvil Local</strong>
            <span>Chain ID 31337</span>
          </div>
        </button>
      </div>
    </aside>
  );
}

/* =========================================================
   通用 Info Card
========================================================= */

function InfoCard({ label, value }) {
  return (
    <div className="info-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   Seller Step
========================================================= */

function SellerStep({
  number,
  title,
  description,
  buttonText,
  active,
  successText,
  waiting,
  onClick,
  status,
}) {
  return (
    <div
      className={`trade-step ${
        active ? "trade-step-active" : ""
      }`}
    >
      <div className="step-number">{number}</div>

      <div className="step-eyebrow">
        STEP {number}
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      {buttonText && (
        <button
          className={`step-button ${
            active ? "primary" : ""
          }`}
          disabled={!active || status === "running"}
          onClick={onClick}
        >
          {buttonText}
        </button>
      )}

      {waiting && (
        <div className="waiting-badge">
          WAITING
        </div>
      )}

      {status === "success" && successText && (
  <div className="step-success">
    {successText}
  </div>
)}
    </div>
  );
}

/* =========================================================
   Buyer Step
========================================================= */

function BuyerStep({
  number,
  title,
  description,
  status,
  statusType,
  buttonText,
  onClick,
  
}) {
  return (
    <div className="trade-step">
      <div className="step-number">{number}</div>

      <div className="step-eyebrow">
        STEP {number}
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      {buttonText && (
        <button
          className="step-button primary"
          onClick={onClick}
        >
          {buttonText}
        </button>
      )}

      <div className={`step-status ${statusType}`}>
        {status}
      </div>
    </div>
  );
}

export default App;