const rawCodes = `
1000  X回零失败
1001  Y回零失败
1002  Z0回零失败
1003  Z回零失败
1004  物镜转换器回零失败
1005  滤光转换器回零失败
1006  上料轴回零失败
1007  下料轴回零失败

1010  上电时，上料轴没有在等待位置
1011  上电时，下料轴没有在等待位置
1012  上电时，托盘过桥检测到有物体

1020  上片或下片开始时，下片仓托盘已满
1021  上片开始时，上片仓无托盘
1022  上片开始时，上料轴没有在等待位置
1023  上片第2步-推片进入XY，片夹进入一半，L轴移到内端部，但L推完开关没有生效
1024  上片第4步-推块退回，XY回零点，但没有检测XY平台有托盘

1025  下片开始时或者下片第7步，U轴没有在等待位置
1026  下片第1步-片槽对准钩子，XY移到待钩的位置，但过桥开关生效
1032  下片第2步-钩子插入片槽，U轴移过去后，但过桥开关生效
1027  下片第4步-片夹前半部钩进片仓，U轴移到等待位置，但过桥开关没有生效
1033  下片第4步-片夹前半部钩进片仓，U轴移到等待位置，但U等待开关没有生效
1028  下片第6步-片夹整体钩进片仓，U轴移动到最外端，但过桥开关生效
1029  下片第6步-片夹整体钩进片仓，U轴移动到最外端，但U正限位开关没有生效
1030  下片第7步-钩子回到等待位置，U轴移到等待位置，但过桥开关生效
1031  下片动作完成后，但检测托盘开关生效

1050  Z运动逼近超时
1051  Z运动多次调整失败
1052  荧光轴运动失败
1053  物镜轴运动失败
1060  快扫时X轴移动失败
1061  快扫时Y轴移动失败
`;

function parseCodes(source) {
  return source
    .trim()
    .split(/\n+/)
    .map((line) => {
      const match = line.trim().match(/^(\d+)\s+(.+)$/);
      return match ? { code: match[1], text: match[2] } : null;
    })
    .filter(Boolean);
}

let codes = parseCodes(rawCodes);

const queryInput = document.querySelector("#query");
const result = document.querySelector("#result");
const codeList = document.querySelector("#codeList");
const count = document.querySelector("#count");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(value, query) {
  if (!query) return value;
  return value.replace(new RegExp(escapeRegExp(query), "gi"), (match) => `<mark>${match}</mark>`);
}

function renderResult(matches, query) {
  const exact = codes.find((item) => item.code === query);

  if (!query) {
    result.className = "result-card";
    result.innerHTML = `
      <p class="result-label">等待输入</p>
      <h2>请输入错误码</h2>
      <p>也可以输入说明中的关键词进行查找。</p>
    `;
    return;
  }

  if (exact) {
    result.className = "result-card";
    result.innerHTML = `
      <p class="result-label">匹配到错误码 ${exact.code}</p>
      <h2>${exact.text}</h2>
      <p>该结果来自错误码表中的精确匹配。</p>
    `;
    return;
  }

  if (matches.length > 0) {
    result.className = "result-card";
    result.innerHTML = `
      <p class="result-label">找到 ${matches.length} 个相关结果</p>
      <h2>${matches[0].code}</h2>
      <p>${matches[0].text}</p>
    `;
    return;
  }

  result.className = "result-card is-empty";
  result.innerHTML = `
    <p class="result-label">未找到</p>
    <h2>没有匹配的错误码</h2>
    <p>请检查输入是否完整，或尝试输入故障说明中的关键词。</p>
  `;
}

function renderList(items, query) {
  count.textContent = `${items.length} / ${codes.length}`;
  codeList.innerHTML = items
    .map(
      (item) => `
        <button class="code-item ${item.code === query ? "is-active" : ""}" type="button" data-code="${item.code}">
          <span class="code">${highlight(item.code, query)}</span>
          <span class="text">${highlight(item.text, query)}</span>
        </button>
      `,
    )
    .join("");
}

function search() {
  const query = queryInput.value.trim();
  const matches = query
    ? codes.filter((item) => item.code.includes(query) || item.text.toLowerCase().includes(query.toLowerCase()))
    : codes;

  renderResult(matches, query);
  renderList(matches, query);
}

codeList.addEventListener("click", (event) => {
  const item = event.target.closest(".code-item");
  if (!item) return;
  queryInput.value = item.dataset.code;
  queryInput.focus();
  search();
});

queryInput.addEventListener("input", search);
search();

fetch("./错误码.txt")
  .then((response) => {
    if (!response.ok) throw new Error("Cannot load error code file");
    return response.text();
  })
  .then((text) => {
    const loadedCodes = parseCodes(text);
    if (loadedCodes.length > 0) {
      codes = loadedCodes;
      search();
    }
  })
  .catch(() => {
    search();
  });
