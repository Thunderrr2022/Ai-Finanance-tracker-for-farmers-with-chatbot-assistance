import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// Dummy data for preview
const PREVIEW_DATA = {
  monthlyReport: {
    userName: "John Doe",
    type: "monthly-report",
    data: {
      month: "December",
      stats: {
        totalIncome: 5000,
        totalExpenses: 3500,
        byCategory: {
          housing: 1500,
          groceries: 600,
          transportation: 400,
          entertainment: 300,
          utilities: 700,
        },
      },
      insights: [
        "Your housing expenses are 43% of your total spending - consider reviewing your housing costs.",
        "Great job keeping entertainment expenses under control this month!",
        "Setting up automatic savings could help you save 20% more of your income.",
      ],
    },
  },
  budgetAlert: {
    userName: "John Doe",
    type: "budget-alert",
    data: {
      percentageUsed: 85,
      budgetAmount: 4000,
      totalExpenses: 3400,
    },
  },
};

export default function EmailTemplate({
  userName = "",
  type = "monthly-report",
  data = {},
}) {
  if (type === "monthly-report") {
    return (
      <Html>
        <Head />
        <Preview>Your Monthly Financial Report</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>Monthly Financial Report</Heading>

            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              Here&rsquo;s your financial summary for {data?.month}:
            </Text>

            {/* Main Stats */}
            <Section style={styles.statsContainer}>
              <div style={styles.stat}>
                <Text style={styles.text}>Total Income</Text>
                <Text style={styles.heading}>${data?.stats.totalIncome}</Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Total Expenses</Text>
                <Text style={styles.heading}>${data?.stats.totalExpenses}</Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Net</Text>
                <Text style={styles.heading}>
                  ${data?.stats.totalIncome - data?.stats.totalExpenses}
                </Text>
              </div>
            </Section>

            {/* Category Breakdown */}
            {data?.stats?.byCategory && (
              <Section style={styles.section}>
                <Heading style={styles.heading}>Expenses by Category</Heading>
                {Object.entries(data?.stats.byCategory).map(
                  ([category, amount]) => (
                    <div key={category} style={styles.row}>
                      <Text style={styles.text}>{category}</Text>
                      <Text style={styles.text}>${amount}</Text>
                    </div>
                  )
                )}
              </Section>
            )}

            {/* AI Insights */}
            {data?.insights && (
              <Section style={styles.section}>
                <Heading style={styles.heading}>Welth Insights</Heading>
                {data.insights.map((insight, index) => (
                  <Text key={index} style={styles.text}>
                    • {insight}
                  </Text>
                ))}
              </Section>
            )}

            <Text style={styles.footer}>
              Thank you for using Welth. Keep tracking your finances for better
              financial health!
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "budget-alert") {
    return (
      <Html>
        <Head />
        <Preview>Budget Alert</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>Budget Alert</Heading>
            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              You&rsquo;ve used {data?.percentageUsed.toFixed(1)}% of your
              monthly budget.
            </Text>
            <Section style={styles.statsContainer}>
              <div style={styles.stat}>
                <Text style={styles.text}>Budget Amount</Text>
                <Text style={styles.heading}>${data?.budgetAmount}</Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Spent So Far</Text>
                <Text style={styles.heading}>${data?.totalExpenses}</Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Remaining</Text>
                <Text style={styles.heading}>
                  ${data?.budgetAmount - data?.totalExpenses}
                </Text>
              </div>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  }
}

const styles = {
  body: {
    backgroundColor: "#f6f9fc",
    fontFamily: "-apple-system, sans-serif",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px",
    borderRadius: "5px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  title: {
    color: "#1f2937",
    fontSize: "32px",
    fontWeight: "bold",
    textAlign: "center",
    margin: "0 0 20px",
  },
  heading: {
    color: "#1f2937",
    fontSize: "20px",
    fontWeight: "600",
    margin: "0 0 16px",
  },
  text: {
    color: "#4b5563",
    fontSize: "16px",
    margin: "0 0 16px",
  },
  section: {
    marginTop: "32px",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "5px",
    border: "1px solid #e5e7eb",
  },
  statsContainer: {
    margin: "32px 0",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "5px",
  },
  stat: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#fff",
    borderRadius: "4px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  footer: {
    color: "#6b7280",
    fontSize: "14px",
    textAlign: "center",
    marginTop: "32px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },
};

const BudgetAlertEmail = ({ data }) => {
  const {
    percentageUsed,
    budgetAmount,
    totalExpenses,
    remainingBudget,
    daysRemaining,
    projectedExpenses,
    projectedPercentage,
    accountName,
    topCategories,
    alertType
  } = data;

  const getAlertColor = () => {
    switch (alertType) {
      case "budget-exceeded":
        return "#EF4444"; // red
      case "budget-projection":
        return "#F59E0B"; // amber
      default:
        return "#3B82F6"; // blue
    }
  };

  const getAlertMessage = () => {
    switch (alertType) {
      case "budget-exceeded":
        return "Your budget has been exceeded!";
      case "budget-projection":
        return "You're on track to exceed your budget!";
      default:
        return "You're approaching your budget limit!";
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={{ ...titleStyle, color: getAlertColor() }}>Budget Alert</h1>
        <p style={subtitleStyle}>{getAlertMessage()}</p>
      </div>

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Budget Overview</h2>
        <div style={gridStyle}>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Current Usage</h3>
            <p style={percentageStyle}>{percentageUsed.toFixed(1)}%</p>
            <div style={progressBarContainerStyle}>
              <div
                style={{
                  ...progressBarStyle,
                  width: `${Math.min(percentageUsed, 100)}%`,
                  backgroundColor: getAlertColor(),
                }}
              />
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Budget Details</h3>
            <div style={detailGridStyle}>
              <div style={detailItemStyle}>
                <span style={detailLabelStyle}>Total Budget:</span>
                <span style={detailValueStyle}>${budgetAmount}</span>
              </div>
              <div style={detailItemStyle}>
                <span style={detailLabelStyle}>Spent:</span>
                <span style={detailValueStyle}>${totalExpenses}</span>
              </div>
              <div style={detailItemStyle}>
                <span style={detailLabelStyle}>Remaining:</span>
                <span style={detailValueStyle}>${remainingBudget}</span>
              </div>
              <div style={detailItemStyle}>
                <span style={detailLabelStyle}>Days Left:</span>
                <span style={detailValueStyle}>{daysRemaining}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Projection</h2>
        <div style={cardStyle}>
          <p style={projectionTextStyle}>
            Based on your current spending rate, you're projected to spend{" "}
            <span style={{ color: getAlertColor() }}>${projectedExpenses}</span> by the end of the month.
            This is <span style={{ color: getAlertColor() }}>{projectedPercentage}%</span> of your budget.
          </p>
        </div>
      </div>

      {topCategories.length > 0 && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Top Spending Categories</h2>
          <div style={cardStyle}>
            <div style={categoryListStyle}>
              {topCategories.map((category, index) => (
                <div key={index} style={categoryItemStyle}>
                  <span style={categoryNameStyle}>{category.name}</span>
                  <div style={categoryDetailsStyle}>
                    <span style={categoryAmountStyle}>${category.amount}</span>
                    <span style={categoryPercentageStyle}>{category.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Recommended Actions</h2>
        <div style={cardStyle}>
          <ul style={actionListStyle}>
            <li style={actionItemStyle}>Review your recent transactions</li>
            <li style={actionItemStyle}>Consider reducing spending in top categories</li>
            <li style={actionItemStyle}>Adjust your budget if needed</li>
            <li style={actionItemStyle}>Set up additional budget alerts</li>
          </ul>
        </div>
      </div>

      <div style={footerStyle}>
        <p style={footerTextStyle}>
          This alert is for your {accountName} account. You can manage your budget settings in the dashboard.
        </p>
      </div>
    </div>
  );
};

const containerStyle = {
  // Add appropriate styles for the container
};

const headerStyle = {
  // Add appropriate styles for the header
};

const subtitleStyle = {
  // Add appropriate styles for the subtitle
};

const sectionStyle = {
  // Add appropriate styles for the section
};

const sectionTitleStyle = {
  // Add appropriate styles for the section title
};

const gridStyle = {
  // Add appropriate styles for the grid
};

const cardStyle = {
  // Add appropriate styles for the card
};

const cardTitleStyle = {
  // Add appropriate styles for the card title
};

const detailGridStyle = {
  // Add appropriate styles for the detail grid
};

const detailItemStyle = {
  // Add appropriate styles for the detail item
};

const detailLabelStyle = {
  // Add appropriate styles for the detail label
};

const detailValueStyle = {
  // Add appropriate styles for the detail value
};

const percentageStyle = {
  // Add appropriate styles for the percentage
};

const progressBarContainerStyle = {
  // Add appropriate styles for the progress bar container
};

const progressBarStyle = {
  // Add appropriate styles for the progress bar
};

const categoryListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const categoryItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
  borderBottom: "1px solid #E5E7EB",
};

const categoryNameStyle = {
  fontSize: "14px",
  color: "#374151",
  fontWeight: "500",
};

const categoryDetailsStyle = {
  display: "flex",
  gap: "16px",
  alignItems: "center",
};

const categoryAmountStyle = {
  fontSize: "14px",
  color: "#374151",
  fontWeight: "600",
};

const categoryPercentageStyle = {
  fontSize: "14px",
  color: "#6B7280",
};

const actionListStyle = {
  listStyleType: "none",
  padding: 0,
  margin: 0,
};

const actionItemStyle = {
  marginBottom: "8px",
  paddingLeft: "20px",
  position: "relative",
  fontSize: "14px",
  color: "#374151",
};

const projectionTextStyle = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "1.5",
};

const footerStyle = {
  // Add appropriate styles for the footer
};

const footerTextStyle = {
  // Add appropriate styles for the footer text
};
