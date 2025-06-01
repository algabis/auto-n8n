# Workflow Examples Search

This directory contains real-world n8n workflow examples that can be searched and referenced by the AI when creating or modifying workflows.

## 🔍 How to Use the Search Feature

The `workflow_examples_search` tool allows you to find relevant workflow examples based on:

- **Node Types**: Search for workflows that use specific n8n nodes
- **Keywords**: Search by filename or workflow name keywords  
- **Smart Filtering**: Get only relevant examples to avoid context overflow

## 📚 Available Examples

Current workflow collection includes:

- **AI & Machine Learning**: AI agents, video generation, data analysis
- **Trading & Finance**: Stock analysis, TradingView integration
- **Communication**: Email scraping, social media automation
- **Data Processing**: Interview conversations, data analysis pipelines

## 🎯 When to Use This Tool

### ✅ Use `workflow_examples_search` when:

1. **Learning Node Implementation**: "How do I use the OpenAI node in a real workflow?"
   ```
   nodeTypes: ["n8n-nodes-base.openai"]
   ```

2. **Finding Similar Use Cases**: "Show me workflows that do social media automation"
   ```
   keywords: ["social", "media"]
   ```

3. **Understanding Node Combinations**: "How do AI agents work with other nodes?"
   ```
   nodeTypes: ["n8n-nodes-base.openai", "n8n-nodes-base.httpRequest"]
   ```

4. **Workflow Patterns**: "Find examples of data analysis workflows"
   ```
   keywords: ["data", "analyst"]
   ```

### ⚠️ Don't use when:

- You need basic node information (use `node_type_info` instead)
- You want all examples (it limits results to prevent context overflow)
- You're looking for simple templates (use `workflow_examples` for basic patterns)

## 🔧 Search Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `nodeTypes` | array | Specific n8n node types to find | `[]` |
| `keywords` | array | Keywords to search in names/descriptions | `[]` |
| `maxExamples` | number | Maximum results (1-5) | `2` |
| `includeFullWorkflow` | boolean | Return full JSON vs relevant excerpts | `false` |

## 💡 Best Practices

### 1. **Start Specific**
```json
{
  "nodeTypes": ["n8n-nodes-base.openai"],
  "maxExamples": 1
}
```

### 2. **Combine Criteria for Better Results**
```json
{
  "nodeTypes": ["n8n-nodes-base.webhook"],
  "keywords": ["api"],
  "maxExamples": 2
}
```

### 3. **Use Keywords for Use Cases**
```json
{
  "keywords": ["trading", "stock"],
  "maxExamples": 1,
  "includeFullWorkflow": true
}
```

### 4. **Get Relevant Excerpts (Default)**
By default, only relevant nodes and their connections are returned to save context space. Set `includeFullWorkflow: true` only when you need the complete workflow structure.

## 📋 Example Responses

### Excerpt Response (Default)
```json
{
  "searchCriteria": {...},
  "totalMatches": 3,
  "returnedExamples": 2,
  "examples": [
    {
      "filename": "simple_ai_agent.json",
      "name": "AI Agent Workflow",
      "matchReasons": ["Contains nodes: n8n-nodes-base.openai"],
      "nodeCount": 5,
      "nodeTypes": ["n8n-nodes-base.webhook", "n8n-nodes-base.openai", "n8n-nodes-base.httpRequest"],
      "relevantNodes": [/* Only OpenAI-related nodes */],
      "relevantConnections": {/* Connections for relevant nodes */}
    }
  ]
}
```

### Full Workflow Response
When `includeFullWorkflow: true`, you get the complete workflow JSON including all nodes, connections, settings, and configuration.

## 🎨 Adding New Examples

To add new workflow examples:

1. Export workflow from n8n as JSON
2. Save to `examples/workflows/descriptive-name.json`
3. Use descriptive filenames (e.g., `ai-content-generator.json`, `slack-notification-system.json`)
4. The search tool will automatically pick up new files

## 🧠 AI Usage Guidelines

**For AI Assistants**: 

- Use this tool when users ask "how do I..." questions about specific nodes
- Search before creating workflows to show real working examples
- Combine with `node_type_info` for complete understanding
- Limit `maxExamples` to 1-2 to preserve context window
- Use `includeFullWorkflow: false` unless full structure is needed
- Explain what you found and why it's relevant to the user's question

This tool bridges the gap between theoretical node knowledge and practical implementation patterns. 