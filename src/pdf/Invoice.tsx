import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2",
    },
    {
      src: "https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1Mu51xIIzQ.woff2",
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontSize: 11,
    padding: 40,
    lineHeight: 1.4,
  },
  header: {
    borderBottom: "1pt solid #000",
    marginBottom: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  clientInfo: {
    marginTop: 5,
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCellHeader: {
    fontWeight: "bold",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 6,
    width: "34%",
  },
  tableCell: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 6,
    width: "34%",
  },
  total: {
    marginTop: 15,
    textAlign: "right",
    fontWeight: "bold",
    fontSize: 12,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    fontSize: 9,
    textAlign: "center",
    width: "100%",
  },
});

type InvoicePDFProps = Readonly<{
  id: string;
  date: string;
  client: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    email?: string;
    phone?: string;
  };
  jobs: ReadonlyArray<{
    id: string;
    name: string;
    hours: number;
    totalPrice: number;
  }>;
  totalAmount: number;
}>;

export const InvoicePDF = ({
  id,
  date,
  client,
  jobs,
  totalAmount,
}: InvoicePDFProps) => (
  <Document>
    <Page>
      <View style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Invoice #{id}</Text>
          <Text>Date: {date}</Text>
        </View>
        <View style={styles.section}>
          <Text style={{ fontWeight: "bold" }}>Bill To:</Text>
          <View style={styles.clientInfo}>
            <Text>{client.name}</Text>
            <Text>{client.address}</Text>
            <Text>
              {client.postalCode} {client.city}
            </Text>
            {client.email && <Text>{client.email}</Text>}
            {client.phone && <Text>{client.phone}</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellHeader}>Jobs</Text>
            <Text style={styles.tableCellHeader}>Hours</Text>
            <Text style={styles.tableCellHeader}>Total Price ($)</Text>
          </View>
          {jobs.map((i) => (
            <View key={i.id} style={styles.tableRow}>
              <Text style={styles.tableCell}>{i.name}</Text>
              <Text style={styles.tableCell}>{i.hours}</Text>
              <Text style={styles.tableCell}>{i.totalPrice.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.total}>Total: $ {totalAmount.toFixed(2)}</Text>
      </View>
    </Page>
  </Document>
);
