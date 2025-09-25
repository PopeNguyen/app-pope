import { Button, Modal, Input, Dropdown, message } from "antd";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Player {
  name: string;
  isPlay: boolean;
  totalPlayerScore: number;
}

interface PlayerScore {
  name: string;
  score: number;
}

interface MatchRow {
  [key: string]: number | string;
  key: number;
  STT: number;
}

export default function CasinoMatch() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [listNamePlay, setListNamePlay] = useState<Player[]>([]);
  const [listDataMatch, setListDataMatch] = useState<PlayerScore[][]>([]);
  const [namePeople, setNamePeople] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogEditVisible, setDialogEditVisible] = useState(false);
  const [dialogAddMatchVisible, setDialogAddMatchVisible] = useState(false);
  const [dataEditPlayer, setDataEditPlayer] = useState<Player[]>([]);
  const [dataOneMatch, setDataOneMatch] = useState<PlayerScore[]>([]);
  const [dataUser, setDataUser] = useState<any>();

  const matchRef = doc(db, "matches", id!);

  useEffect(() => {
    if (!id) return; // tránh chạy khi chưa có id

    const fetchData = async () => {
      try {
        const matchDocRef = doc(db, "matches", id); // "matches" là tên collection
        const docSnap = await getDoc(matchDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setDataUser(data)
          
          setListNamePlay(data?.listNamePlay || []);
          setListDataMatch(data?.listDataMatch || []);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      }
    };
    fetchData();
  }, [id]);

  const saveToFirebase = async (
    newListNamePlay: Player[],
    newListDataMatch: PlayerScore[][]
  ) => {
    await setDoc(matchRef, {
      ...dataUser,
      listNamePlay: newListNamePlay,
      listDataMatch: newListDataMatch,
    });
  };

  const scorePlayer = (name: string) => {
    return listDataMatch.reduce((total, match) => {
      const player = match?.find((i) => i.name === name);
      return total + (player?.score || 0);
    }, 0);
  };

  const headers = ["STT", ...listNamePlay.map((p) => p.name)];
  const tableData: MatchRow[] = listDataMatch.map((match, index) => {
    const row: MatchRow = {
      key: index,
      STT: listDataMatch.length - index,
    };
    match.forEach((p) => {
      row[p.name] = p.score;
    });
    return row;
  });

  const addPeople = () => {
    const newList: Player[] = [
      { name: namePeople, isPlay: true, totalPlayerScore: 0 },
      ...listNamePlay,
    ];
    setListNamePlay(newList);
    saveToFirebase(newList, listDataMatch);
    setNamePeople("");
    setDialogVisible(false);
  };

  const editPlayer = () => {
    setListNamePlay(dataEditPlayer);
    saveToFirebase(dataEditPlayer, listDataMatch);
    setDialogEditVisible(false);
  };

  const openDialogAddMatch = () => {
    const initMatch = listNamePlay.map((p) => ({
      name: p.name,
      score: 0,
    }));
    setDataOneMatch(initMatch);
    setDialogAddMatchVisible(true);
  };

  const totalOneMatch = dataOneMatch.reduce((sum, i) => sum + i.score, 0);

  const addMatch = () => {
    if (totalOneMatch !== 0) {
      message.error("Tổng điểm không cân bằng");
      return;
    }
    const newList = [dataOneMatch, ...listDataMatch];
    console.log("newList", newList);
    // setListDataMatch(newList);
    // saveToFirebase(listNamePlay, newList);
    // setDialogAddMatchVisible(false);
  };

  const deleteMatch = (matchIndex: number) => {
    const newList = listDataMatch.filter((_, i) => i !== matchIndex);
    setListDataMatch(newList);
    saveToFirebase(listNamePlay, newList);
  };

  return (
    <div className="p-4">
      {/* Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={() => setDialogVisible(true)}>Thêm người chơi</Button>
        <Button
          onClick={() => {
            setDataEditPlayer([...listNamePlay]);
            setDialogEditVisible(true);
          }}
        >
          Sửa người tham gia
        </Button>
        <Button onClick={openDialogAddMatch}>Thêm ván mới</Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-max border-collapse border border-gray-300">
          <tbody>
            {headers.map((header, rowIdx) => (
              <tr key={rowIdx}>
                <th className="border border-gray-300 px-4 py-2 sticky left-0 z-10 text-left font-semibold">
                  {header !== "STT"
                    ? `${header} / ${scorePlayer(header)}`
                    : header}
                </th>
                {tableData.map((row, colIdx) => (
                  <td
                    key={colIdx}
                    className="border border-gray-300 px-4 py-2 text-center"
                  >
                    {header === "STT" ? (
                      <Dropdown
                        menu={{
                          items: [
                            {
                              label: "Xóa",
                              key: "delete",
                              onClick: () => deleteMatch(colIdx),
                            },
                          ],
                        }}
                        trigger={["click"]}
                      >
                        <Button>{row[header]}</Button>
                      </Dropdown>
                    ) : (
                      row[header]?.toString() ?? ""
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Thêm người */}
      <Modal
        title="Thêm người mới"
        open={dialogVisible}
        onCancel={() => setDialogVisible(false)}
        onOk={addPeople}
      >
        <Input
          placeholder="Tên người mới"
          value={namePeople}
          onChange={(e) => setNamePeople(e.target.value)}
        />
      </Modal>

      {/* Modal: Sửa người */}
      <Modal
        title="Sửa người chơi"
        open={dialogEditVisible}
        onCancel={() => setDialogEditVisible(false)}
        onOk={editPlayer}
      >
        {dataEditPlayer.map((item, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-4 mb-2">
            <p>{item.name}</p>
            <p>{item.isPlay ? "Đang chơi" : "Tạm nghỉ"}</p>
            <Button
              onClick={() => {
                const updated = [...dataEditPlayer];
                updated[idx].isPlay = !updated[idx].isPlay;
                setDataEditPlayer(updated);
              }}
            >
              Đổi trạng thái
            </Button>
          </div>
        ))}
      </Modal>

      {/* Modal: Thêm ván */}
      <Modal
        title="Thêm ván mới"
        open={dialogAddMatchVisible}
        onCancel={() => setDialogAddMatchVisible(false)}
        onOk={addMatch}
      >
        <p className="text-center text-2xl font-bold mb-4">
          Tổng tiền: {totalOneMatch}
        </p>
        {dataOneMatch.map((item, idx) =>
          listNamePlay.find((p) => p.name === item.name && p.isPlay) ? (
            <div
              key={idx}
              className={`grid grid-cols-3 gap-4 p-2 ${
                idx % 2 === 0 ? "bg-gray-100" : ""
              }`}
            >
              <div>{item.name}</div>
              <div>{item.score}</div>
              <div className="flex gap-2">
                <Button
                  size="small"
                  onClick={() => {
                    const updated = [...dataOneMatch];
                    updated[idx].score += 1;
                    setDataOneMatch(updated);
                  }}
                >
                  +1
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    const updated = [...dataOneMatch];
                    updated[idx].score -= 1;
                    setDataOneMatch(updated);
                  }}
                >
                  -1
                </Button>
              </div>
            </div>
          ) : null
        )}
      </Modal>
    </div>
  );
}
